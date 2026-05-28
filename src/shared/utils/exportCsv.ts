export function exportToCsv<T>(filename: string, data: T[], columns: { header: string; accessor: (row: T) => string | number }[]) {
  if (!data || data.length === 0) return;

  const headerRow = columns.map(c => `"${c.header}"`).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      const value = c.accessor(row);
      const str = value === null || value === undefined ? '' : String(value);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = [headerRow, ...rows].join('\n');
  // Add BOM for UTF-8 Excel compatibility
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
