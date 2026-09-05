import { z } from 'zod';

/**
 * ============================================================================
 * 1. REGEX PATTERNS & SANITIZATION UTILITIES
 * ============================================================================
 */

export const VN_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const FULLNAME_REGEX = /^[a-zA-ZÀ-ỹ\s'.-]+$/u;
export const CODE_REGEX = /^[A-Z0-9_-]+$/;
export const PASSWORD_STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;

/**
 * Tiện ích Sanitization: Tự động loại bỏ khoảng trắng, chuẩn hóa viết hoa và lọc ký tự rác
 */
export const sanitize = {
  trim: (val: unknown) => (typeof val === 'string' ? val.trim() : val),
  cleanPhone: (val: unknown) => (typeof val === 'string' ? val.replace(/[\s.-]+/g, '') : val),
  toUpperCase: (val: unknown) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  toLowerCase: (val: unknown) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  parsePositiveNumber: (val: unknown) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const clean = val.replace(/[^\d.-]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  },
};

/**
 * ============================================================================
 * 2. ATOMIC FIELD SCHEMAS (WITH AUTOMATIC SANITIZATION)
 * ============================================================================
 */

export const phoneSchema = z.preprocess(
  sanitize.cleanPhone,
  z
    .string({ message: 'Số điện thoại không được để trống' })
    .min(1, 'Số điện thoại không được để trống')
    .regex(VN_PHONE_REGEX, 'SĐT không hợp lệ (Bắt buộc 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)')
);

export const optionalPhoneSchema = z.preprocess(
  sanitize.cleanPhone,
  z
    .string()
    .optional()
    .refine(
      (val) => !val || VN_PHONE_REGEX.test(val),
      'SĐT không hợp lệ (Bắt buộc 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)'
    )
);

export const emailSchema = z.preprocess(
  sanitize.toLowerCase,
  z
    .string({ message: 'Email không được để trống' })
    .min(1, 'Email không được để trống')
    .regex(EMAIL_REGEX, 'Email không đúng định dạng chuẩn (VD: nguyenvana@gmail.com)')
);

export const optionalEmailSchema = z.preprocess(
  sanitize.toLowerCase,
  z
    .string()
    .optional()
    .refine(
      (val) => !val || EMAIL_REGEX.test(val),
      'Email không đúng định dạng chuẩn (VD: nguyenvana@gmail.com)'
    )
);

export const fullNameSchema = z.preprocess(
  sanitize.trim,
  z
    .string({ message: 'Họ và tên không được để trống' })
    .min(2, 'Họ và tên phải có tối thiểu 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự')
    .regex(FULLNAME_REGEX, 'Họ và tên chỉ được chứa chữ cái tiếng Việt, không chứa số hoặc ký tự đặc biệt')
);

export const passwordSchema = z
  .string({ message: 'Mật khẩu không được để trống' })
  .min(8, 'Mật khẩu phải có tối thiểu 8 ký tự')
  .regex(
    PASSWORD_STRONG_REGEX,
    'Mật khẩu phải bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&._-)'
  );

export const businessCodeSchema = z.preprocess(
  sanitize.toUpperCase,
  z
    .string({ message: 'Mã không được để trống' })
    .min(3, 'Mã phải có tối thiểu 3 ký tự')
    .max(50, 'Mã không vượt quá 50 ký tự')
    .regex(CODE_REGEX, 'Mã chỉ chấp nhận chữ in hoa (không dấu), số và dấu gạch nối (- hoặc _)')
);

export const positiveMoneySchema = z.preprocess(
  sanitize.parsePositiveNumber,
  z
    .number({ message: 'Số tiền không được để trống' })
    .min(0, 'Số tiền không được là số âm')
    .max(100_000_000_000, 'Số tiền vượt quá giới hạn tối đa cho phép')
);

export const positiveQuantitySchema = z.preprocess(
  sanitize.parsePositiveNumber,
  z
    .number({ message: 'Số lượng không được để trống' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1')
);

export const dateOfBirthSchema = z
  .string({ message: 'Ngày sinh không được để trống' })
  .min(1, 'Ngày sinh không được để trống')
  .refine((val) => new Date(val) <= new Date(), 'Ngày sinh không được lớn hơn ngày hiện tại');

/**
 * ============================================================================
 * 3. COMPOSITE FORM SCHEMAS (CRM, INVENTORY, FINANCE)
 * ============================================================================
 */

// ── Customer Form Schema ──
export const customerFormSchema = z.object({
  customerCode: businessCodeSchema.optional(),
  name: fullNameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER'),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) <= new Date(), 'Ngày sinh không được lớn hơn ngày hiện tại'),
  address: z.string().trim().optional(),
  taxCode: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9-]{10,14}$/.test(val), 'Mã số thuế phải từ 10 đến 14 chữ số'),
  creditLimit: positiveMoneySchema.default(0),
  groupId: z.string().optional(),
  areaId: z.string().optional(),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

// ── Bank Account Schema (Finance) ──
export const bankAccountFormSchema = z.object({
  bankName: z.string({ message: 'Tên ngân hàng không được để trống' }).min(2, 'Tên ngân hàng tối thiểu 2 ký tự'),
  accountNumber: z
    .string({ message: 'Số tài khoản không được để trống' })
    .trim()
    .min(6, 'Số tài khoản tối thiểu 6 chữ số')
    .max(25, 'Số tài khoản tối đa 25 chữ số'),
  accountHolder: fullNameSchema,
  branchName: z.string().min(2, 'Chi nhánh mở tài khoản không được để trống'),
  swiftBic: z.string().trim().toUpperCase().optional(),
  currency: z.enum(['VND', 'USD', 'EUR', 'GBP']).default('VND'),
  currentBalance: positiveMoneySchema.default(0),
  accountType: z.enum(['PRIMARY_OPERATING', 'PAYROLL_DISBURSEMENT', 'MERCHANT_SETTLEMENT', 'ESCROW_RESERVE']).default('PRIMARY_OPERATING'),
  status: z.enum(['ACTIVE', 'RESTRICTED', 'INACTIVE']).default('ACTIVE'),
});

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;

/**
 * ============================================================================
 * 4. DYNAMIC NESTED ARRAY SCHEMAS (FIELD ARRAY VALIDATION)
 * ============================================================================
 */

// ── 4.1 Purchase Order Line & PO Form Schema (Đơn Đặt Hàng Nhập Kho) ──
export const purchaseOrderLineSchema = z.object({
  productId: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  sku: businessCodeSchema,
  productName: z.string().min(1, 'Tên sản phẩm không được để trống'),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  quantity: positiveQuantitySchema,
  unitPrice: positiveMoneySchema,
  taxRate: z.number().min(0).max(1).default(0.08),
  subTotal: positiveMoneySchema,
  notes: z.string().optional(),
});

export type PurchaseOrderLineValues = z.infer<typeof purchaseOrderLineSchema>;

export const purchaseOrderFormSchema = z
  .object({
    poCode: businessCodeSchema,
    supplierId: z.string().min(1, 'Vui lòng chọn nhà cung cấp'),
    destinationBranchId: z.string().min(1, 'Vui lòng chọn chi nhánh nhận hàng'),
    orderDate: z.string().min(1, 'Ngày đặt hàng không được để trống'),
    expectedDeliveryDate: z.string().min(1, 'Ngày dự kiến giao hàng không được để trống'),
    items: z
      .array(purchaseOrderLineSchema)
      .min(1, 'Đơn hàng nhập kho phải có ít nhất 1 sản phẩm / thiết bị')
      .refine((items) => {
        // Kiểm tra không cho trùng SKU giữa các dòng
        const skus = items.map((i) => i.sku);
        return new Set(skus).size === skus.length;
      }, 'Không được chọn trùng sản phẩm / SKU trên nhiều dòng khác nhau trong cùng đơn PO'),
    discountAmount: positiveMoneySchema.default(0),
    shippingFee: positiveMoneySchema.default(0),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => new Date(data.orderDate) <= new Date(data.expectedDeliveryDate), {
    message: 'Ngày dự kiến giao hàng phải sau hoặc bằng ngày lập đơn',
    path: ['expectedDeliveryDate'],
  });

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

// ── 4.2 Combo Detail Item & Combo Form Schema ──
export const comboDetailItemSchema = z.object({
  productId: z.string().min(1, 'Vui lòng chọn sản phẩm thành phần'),
  sku: businessCodeSchema,
  productName: z.string().min(1, 'Tên sản phẩm không được để trống'),
  quantity: positiveQuantitySchema,
  costPrice: positiveMoneySchema,
  retailPrice: positiveMoneySchema,
});

export const comboFormSchema = z.object({
  comboCode: businessCodeSchema,
  comboName: z.string().min(2, 'Tên Combo tối thiểu 2 ký tự').max(150),
  comboBarcode: z.string().trim().optional(),
  comboPrice: positiveMoneySchema,
  branchId: z.string().default('ALL'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  items: z
    .array(comboDetailItemSchema)
    .min(2, 'Một gói Combo phải bao gồm tối thiểu 2 sản phẩm thành phần')
    .refine((items) => {
      const skus = items.map((i) => i.sku);
      return new Set(skus).size === skus.length;
    }, 'Combo không thể chứa các sản phẩm thành phần trùng lặp mã SKU'),
  description: z.string().max(500).optional(),
});

export type ComboFormValues = z.infer<typeof comboFormSchema>;

// ── 4.3 Product Multi-Variants Schema (Sản phẩm nhiều biến thể Màu/Size) ──
export const productVariantSchema = z.object({
  sku: businessCodeSchema,
  barcode: z.string().trim().optional(),
  colorName: z.string().min(1, 'Màu sắc không được để trống'),
  sizeName: z.string().min(1, 'Kích cỡ không được để trống'),
  costPrice: positiveMoneySchema,
  salePrice: positiveMoneySchema,
  stockQuantity: z.number().int().min(0, 'Tồn kho ban đầu không được âm').default(0),
});

export const productWithVariantsFormSchema = z
  .object({
    productCode: businessCodeSchema,
    productName: z.string().min(2, 'Tên sản phẩm tối thiểu 2 ký tự').max(200),
    categoryId: z.string().min(1, 'Vui lòng chọn danh mục sản phẩm'),
    unit: z.string().min(1, 'Đơn vị tính không được để trống'),
    hasVariants: z.boolean().default(false),
    baseCostPrice: positiveMoneySchema,
    baseSalePrice: positiveMoneySchema,
    variants: z.array(productVariantSchema).optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.hasVariants) {
        if (!data.variants || data.variants.length === 0) return false;
        // Check duplicate variant SKU
        const skus = data.variants.map((v) => v.sku);
        return new Set(skus).size === skus.length;
      }
      return true;
    },
    {
      message: 'Sản phẩm có biến thể phải có ít nhất 1 biến thể và các mã SKU không được trùng nhau',
      path: ['variants'],
    }
  );

export type ProductWithVariantsFormValues = z.infer<typeof productWithVariantsFormSchema>;
