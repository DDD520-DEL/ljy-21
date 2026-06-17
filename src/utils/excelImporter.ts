import * as XLSX from 'xlsx';

export interface HouseholdImportRow {
  rowNumber: number;
  ownerName: string;
  phone: string;
  floor: number;
  unit: string;
  area: number;
  isValid: boolean;
  errors: string[];
}

export interface ImportResult {
  validRows: HouseholdImportRow[];
  invalidRows: HouseholdImportRow[];
  totalRows: number;
}

const REQUIRED_HEADERS = ['姓名', '电话', '楼层', '房号', '面积'];

function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 0) return false;
  if (cleaned.length === 11 && /^1[3-9]\d{9}$/.test(cleaned)) {
    return true;
  }
  if (cleaned.length >= 7 && cleaned.length <= 12) {
    return true;
  }
  return false;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s/g, '');
}

function findColumnIndex(headers: string[], target: string): number {
  const normalizedTarget = normalizeHeader(target);
  return headers.findIndex((h) => normalizeHeader(h) === normalizedTarget);
}

export function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as (string | number)[][];

        if (jsonData.length < 2) {
          reject(new Error('Excel 文件至少需要包含标题行和一行数据'));
          return;
        }

        const headers = jsonData[0].map((h) => String(h));

        for (const required of REQUIRED_HEADERS) {
          if (findColumnIndex(headers, required) === -1) {
            reject(
              new Error(
                `缺少必要的列标题：${required}。请确保 Excel 包含以下列：${REQUIRED_HEADERS.join('、')}`
              )
            );
            return;
          }
        }

        const nameIdx = findColumnIndex(headers, '姓名');
        const phoneIdx = findColumnIndex(headers, '电话');
        const floorIdx = findColumnIndex(headers, '楼层');
        const unitIdx = findColumnIndex(headers, '房号');
        const areaIdx = findColumnIndex(headers, '面积');

        const validRows: HouseholdImportRow[] = [];
        const invalidRows: HouseholdImportRow[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNumber = i + 1;
          const errors: string[] = [];

          const ownerName = String(row[nameIdx] || '').trim();
          const phoneRaw = String(row[phoneIdx] || '').trim();
          const floorRaw = String(row[floorIdx] || '').trim();
          const unit = String(row[unitIdx] || '').trim();
          const areaRaw = String(row[areaIdx] || '').trim();

          if (!ownerName) {
            errors.push('姓名不能为空');
          }

          if (!phoneRaw) {
            errors.push('电话不能为空');
          } else if (!validatePhone(phoneRaw)) {
            errors.push('电话格式不正确，请输入有效的手机号（11位）或座机号（7-12位）');
          }

          let floor = 0;
          if (!floorRaw) {
            errors.push('楼层不能为空');
          } else {
            floor = parseInt(floorRaw, 10);
            if (isNaN(floor) || floor <= 0) {
              errors.push('楼层必须是大于0的整数');
            }
          }

          if (!unit) {
            errors.push('房号不能为空');
          }

          let area = 0;
          if (!areaRaw) {
            errors.push('面积不能为空');
          } else {
            area = parseFloat(areaRaw);
            if (isNaN(area) || area <= 0) {
              errors.push('面积必须是大于0的数字');
            }
          }

          const importRow: HouseholdImportRow = {
            rowNumber,
            ownerName,
            phone: phoneRaw,
            floor,
            unit,
            area,
            isValid: errors.length === 0,
            errors,
          };

          if (importRow.isValid) {
            validRows.push(importRow);
          } else {
            invalidRows.push(importRow);
          }
        }

        resolve({
          validRows,
          invalidRows,
          totalRows: jsonData.length - 1,
        });
      } catch (error) {
        reject(new Error('解析 Excel 文件失败：' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsBinaryString(file);
  });
}

export function generateExcelTemplate(): void {
  const headers = ['姓名', '电话', '楼层', '房号', '面积'];
  const sampleData = [
    ['张三', '13800138001', 1, '101', 85.5],
    ['李四', '13800138002', 1, '102', 90.0],
    ['王五', '13800138003', 2, '201', 85.5],
    ['赵六', '13800138004', 2, '202', 90.0],
    ['钱七', '13800138005', 3, '301', 85.5],
    ['孙八', '13800138006', 3, '302', 90.0],
  ];

  const wsData = [headers, ...sampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = [
    { wch: 12 },
    { wch: 15 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '住户信息');

  XLSX.writeFile(workbook, '住户信息导入模板.xlsx');
}
