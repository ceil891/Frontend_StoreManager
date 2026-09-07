import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';
const STORAGE_KEY_PREFIX = 'hrm_face_descriptor_';
const ENROLLED_LIST_KEY = 'hrm_face_enrolled_user_ids';

let modelsLoadedPromise: Promise<boolean> | null = null;

export interface FaceMatchResult {
  userId: string;
  distance: number;
  similarityPercentage: number;
}

export interface EnrolledFaceData {
  userId: string;
  fullName: string;
  descriptor: number[];
  enrolledAt: string;
}

export const faceApiService = {
  isModelsLoaded(): boolean {
    return (
      faceapi.nets.tinyFaceDetector.isLoaded &&
      faceapi.nets.faceLandmark68Net.isLoaded &&
      faceapi.nets.faceRecognitionNet.isLoaded
    );
  },

  async loadModels(): Promise<boolean> {
    if (this.isModelsLoaded()) return true;
    if (modelsLoadedPromise) return modelsLoadedPromise;

    modelsLoadedPromise = (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        return true;
      } catch (err) {
        console.error('Lỗi khi tải AI Face Recognition models:', err);
        modelsLoadedPromise = null;
        throw err;
      }
    })();

    return modelsLoadedPromise;
  },

  async detectFaceAndDescriptor(videoEl: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.isModelsLoaded()) {
      await this.loadModels();
    }

    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
    });

    const detection = await faceapi
      .detectSingleFace(videoEl, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection || null;
  },

  saveFaceDescriptor(userId: string, fullName: string, descriptor: Float32Array | number[]): void {
    const arr = Array.from(descriptor);
    const data: EnrolledFaceData = {
      userId,
      fullName,
      descriptor: arr,
      enrolledAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(data));
      const rawList = localStorage.getItem(ENROLLED_LIST_KEY);
      const list: string[] = rawList ? JSON.parse(rawList) : [];
      if (!list.includes(String(userId))) {
        list.push(String(userId));
        localStorage.setItem(ENROLLED_LIST_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.error('Lỗi khi lưu Face Descriptor vào localStorage:', e);
    }
  },

  getFaceDescriptor(userId: string): EnrolledFaceData | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getAllEnrolledFaces(): EnrolledFaceData[] {
    try {
      const rawList = localStorage.getItem(ENROLLED_LIST_KEY);
      if (!rawList) return [];
      const list: string[] = JSON.parse(rawList);
      const res: EnrolledFaceData[] = [];
      for (const uid of list) {
        const d = this.getFaceDescriptor(uid);
        if (d && d.descriptor && d.descriptor.length === 128) {
          res.push(d);
        }
      }
      return res;
    } catch {
      return [];
    }
  },

  deleteFaceDescriptor(userId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
      const rawList = localStorage.getItem(ENROLLED_LIST_KEY);
      if (rawList) {
        const list: string[] = JSON.parse(rawList);
        const next = list.filter(id => id !== String(userId));
        localStorage.setItem(ENROLLED_LIST_KEY, JSON.stringify(next));
      }
    } catch (e) {
      console.error('Lỗi khi xóa Face Descriptor:', e);
    }
  },

  findBestMatch(
    queryDescriptor: Float32Array | number[],
    threshold = 0.55
  ): (FaceMatchResult & { enrolled: EnrolledFaceData }) | null {
    const enrolled = this.getAllEnrolledFaces();
    if (enrolled.length === 0) return null;

    let bestMatch: (FaceMatchResult & { enrolled: EnrolledFaceData }) | null = null;
    let minDistance = Infinity;

    for (const item of enrolled) {
      const dist = faceapi.euclideanDistance(queryDescriptor, item.descriptor);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = {
          userId: item.userId,
          distance: dist,
          similarityPercentage: Math.max(0, Math.min(100, Math.round((1 - dist) * 100))),
          enrolled: item,
        };
      }
    }

    if (bestMatch && bestMatch.distance <= threshold) {
      return bestMatch;
    }
    return null;
  },

  verifyUserFace(
    userId: string,
    queryDescriptor: Float32Array | number[],
    threshold = 0.55
  ): { isMatch: boolean; distance: number; similarityPercentage: number } {
    const enrolled = this.getFaceDescriptor(userId);
    if (!enrolled) {
      return { isMatch: false, distance: 1.0, similarityPercentage: 0 };
    }
    const dist = faceapi.euclideanDistance(queryDescriptor, enrolled.descriptor);
    return {
      isMatch: dist <= threshold,
      distance: dist,
      similarityPercentage: Math.max(0, Math.min(100, Math.round((1 - dist) * 100))),
    };
  }
};
