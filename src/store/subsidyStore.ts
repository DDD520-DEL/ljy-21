import { create } from 'zustand';
import type { SubsidyPolicy, PolicyLevel } from '@/types';

const STORAGE_KEY = 'subsidy_policies';
const STORAGE_VERSION_KEY = 'subsidy_policies_version';
const CURRENT_VERSION = 1;

function generateId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 11);
}

const defaultPolicies: SubsidyPolicy[] = [
  {
    id: 'policy-1',
    title: '国务院办公厅关于全面推进城镇老旧小区改造工作的指导意见',
    level: 'national',
    province: '全国',
    city: '全国',
    subsidyStandard: '中央财政支持城镇老旧小区改造，地方财政配套，鼓励社会资本参与。加装电梯可纳入改造内容，享受相应补贴政策。',
    subsidyAmount: { min: 0, max: 0, unit: '万元' },
    applicationConditions: [
      '城镇老旧小区（建成年代较早、失养失修失管、市政配套设施不完善、社区服务设施不健全、居民改造意愿强烈的住宅小区）',
      '符合纳入年度改造计划条件',
      '居民同意加装电梯并完成相关手续',
    ],
    requiredMaterials: [
      { name: '加装电梯申请表', required: true },
      { name: '业主同意书（需占专有部分面积三分之二以上的业主且占总人数三分之二以上的业主同意）', required: true },
      { name: '房屋权属证明材料', required: true },
      { name: '加装电梯设计方案', required: true },
      { name: '其他地方要求的材料', required: false },
    ],
    sourceUrl: 'http://www.gov.cn/zhengce/content/2020-07/20/content_5528272.htm',
    sourceName: '中国政府网',
    effectiveDate: '2020-07-10',
    issuingDepartment: '国务院办公厅',
    documentNumber: '国办发〔2020〕23号',
    summary: '国家层面老旧小区改造指导文件，明确支持加装电梯等改造内容，要求各地完善配套政策。',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'policy-2',
    title: '上海市既有多层住宅加装电梯资金补贴实施办法',
    level: 'city',
    province: '上海市',
    city: '上海市',
    subsidyStandard: '每台电梯补贴金额不超过28万元，由市、区两级财政按比例分担。具体补贴标准根据房屋楼层数等因素确定。',
    subsidyAmount: { min: 24, max: 28, unit: '万元' },
    applicationConditions: [
      '具有合法权属证明的本市行政区域内既有多层住宅（四层及以上）',
      '房屋结构符合加装电梯安全要求',
      '经本幢房屋全体业主同意（或符合地方规定的同意比例）',
      '已完成加装电梯项目备案',
    ],
    requiredMaterials: [
      { name: '加装电梯补贴资金申请表', required: true },
      { name: '不动产权证（房地产权证）复印件', required: true },
      { name: '业主同意加装电梯的书面证明', required: true },
      { name: '加装电梯项目备案证明', required: true },
      { name: '施工合同及工程预算书', required: true },
      { name: '电梯产品合格证', required: true },
      { name: '竣工验收合格证明', required: true },
      { name: '申请人身份证明材料', required: true },
    ],
    sourceUrl: 'https://www.shanghai.gov.cn/nw12344/20200402/c0b1a9b1b6f849e4a3a8e2c5f8d1a6b3.html',
    sourceName: '上海市人民政府',
    effectiveDate: '2020-01-01',
    issuingDepartment: '上海市住房和城乡建设管理委员会',
    documentNumber: '沪建房管联〔2019〕876号',
    summary: '上海市既有多层住宅加装电梯补贴政策，每台最高补贴28万元，覆盖全市范围，支持业主自主加装电梯。',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'policy-3',
    title: '广州市老旧小区住宅加装电梯工作方案',
    level: 'city',
    province: '广东省',
    city: '广州市',
    subsidyStandard: '每台电梯补贴10万元，各区可根据实际情况另行增加补贴资金。对特殊困难家庭给予额外补助。',
    subsidyAmount: { min: 10, max: 15, unit: '万元' },
    applicationConditions: [
      '广州市行政区域内具有合法权属证明的老旧小区住宅',
      '房屋层数为四层及以上且未设电梯的住宅',
      '经加装电梯所在单元房屋专有部分占建筑物总面积三分之二以上的业主且占总人数三分之二以上的业主同意',
      '符合规划、建设、消防等相关规定',
    ],
    requiredMaterials: [
      { name: '广州市既有住宅加装电梯财政补贴申请表', required: true },
      { name: '加装电梯协议及业主同意书', required: true },
      { name: '不动产权属证书复印件', required: true },
      { name: '规划许可文件', required: true },
      { name: '施工许可文件', required: true },
      { name: '竣工验收资料', required: true },
      { name: '电梯使用登记证', required: true },
      { name: '工程费用发票或凭证', required: true },
    ],
    sourceUrl: 'http://www.gz.gov.cn/zwgk/fggswj/szfgk/content/post_5678901.html',
    sourceName: '广州市人民政府',
    effectiveDate: '2019-06-01',
    issuingDepartment: '广州市住房和城乡建设局',
    documentNumber: '穗建规字〔2019〕6号',
    summary: '广州市老旧小区加装电梯补贴方案，每台电梯补贴10万元，鼓励各区增加配套资金，支持城市更新改造。',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'policy-4',
    title: '北京市既有多层住宅加装电梯工作实施意见',
    level: 'city',
    province: '北京市',
    city: '北京市',
    subsidyStandard: '对城六区及行政副中心每台电梯给予建设总费用30%的补贴，最高不超过24万元；其他区给予40%的补贴，最高不超过32万元。同时给予每台电梯每年最高不超过5000元的运行维护补贴，补贴期限不超过5年。',
    subsidyAmount: { min: 24, max: 32, unit: '万元' },
    applicationConditions: [
      '北京市行政区域内具有合法权属证明的既有多层住宅（四层及以上）',
      '房屋未列入房屋征收范围和计划',
      '业主就加装电梯事宜达成书面协议',
      '符合规划、建设、安全、消防等法律、法规规定',
    ],
    requiredMaterials: [
      { name: '既有住宅加装电梯财政补贴资金申请表', required: true },
      { name: '加装电梯工程协议及业主同意书', required: true },
      { name: '房屋所有权证或不动产权证书复印件', required: true },
      { name: '规划部门意见或审批文件', required: true },
      { name: '工程竣工验收报告', required: true },
      { name: '电梯监督检验报告', required: true },
      { name: '电梯使用登记标志', required: true },
      { name: '工程费用结算凭证', required: true },
      { name: '申请人银行卡信息', required: true },
    ],
    sourceUrl: 'http://www.beijing.gov.cn/zhengce/zhengcefagui/201905/t20190522_59361.html',
    sourceName: '北京市人民政府',
    effectiveDate: '2019-05-22',
    issuingDepartment: '北京市住房和城乡建设委员会',
    documentNumber: '京建发〔2019〕289号',
    summary: '北京市既有住宅加装电梯补贴政策，区分区域给予30%-40%建设费用补贴，最高32万元，并提供5年运维补贴。',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'policy-5',
    title: '浙江省既有住宅加装电梯工作实施意见',
    level: 'province',
    province: '浙江省',
    city: '全省',
    subsidyStandard: '省级财政对各县（市、区）既有住宅加装电梯给予适当补助，具体标准由各地结合实际制定。鼓励各地按照每台电梯15万-25万元标准给予补贴。',
    subsidyAmount: { min: 15, max: 25, unit: '万元' },
    applicationConditions: [
      '浙江省行政区域内具有合法权属证明的四层及以上非单一产权既有住宅',
      '符合城乡规划、建筑设计、消防、抗震等相关规定',
      '经本单元房屋专有部分占建筑物总面积三分之二以上的业主且占总人数三分之二以上的业主同意',
      '已签订加装电梯协议',
    ],
    requiredMaterials: [
      { name: '既有住宅加装电梯申请表', required: true },
      { name: '业主身份证和房屋权属证明', required: true },
      { name: '加装电梯业主协议及同意书', required: true },
      { name: '加装电梯设计方案及图纸', required: true },
      { name: '相关部门审批意见', required: true },
      { name: '工程竣工验收资料', required: true },
      { name: '电梯验收合格证明', required: true },
    ],
    sourceUrl: 'http://www.zj.gov.cn/art/2018/12/29/art_1229019356_3701.html',
    sourceName: '浙江省人民政府',
    effectiveDate: '2019-01-01',
    issuingDepartment: '浙江省住房和城乡建设厅',
    documentNumber: '浙建〔2018〕23号',
    summary: '浙江省全省范围加装电梯指导意见，鼓励各地按15-25万元/台标准补贴，支持全省老旧小区改造升级。',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'policy-6',
    title: '杭州市既有住宅加装电梯财政资金补助办法',
    level: 'city',
    province: '浙江省',
    city: '杭州市',
    subsidyStandard: '对符合条件的既有住宅加装电梯项目，给予每台20万元的补助，其中市级财政承担10万元，区、县（市）级财政承担10万元。',
    subsidyAmount: { min: 20, max: 20, unit: '万元' },
    applicationConditions: [
      '杭州市行政区域内具有合法权属证明的既有多层住宅（四层及以上）',
      '房屋未列入征收范围',
      '符合城市规划、建筑结构安全、消防安全等要求',
      '取得加装电梯相关审批手续',
    ],
    requiredMaterials: [
      { name: '杭州市既有住宅加装电梯财政补助申请表', required: true },
      { name: '业主身份证明和房屋权属证明材料', required: true },
      { name: '加装电梯协议书（含业主同意书）', required: true },
      { name: '规划、建设等相关审批文件', required: true },
      { name: '工程竣工验收合格证明材料', required: true },
      { name: '特种设备（电梯）使用登记证', required: true },
      { name: '工程款支付凭证', required: true },
    ],
    sourceUrl: 'http://www.hangzhou.gov.cn/art/2019/3/25/art_1229063383_4035.html',
    sourceName: '杭州市人民政府',
    effectiveDate: '2019-04-01',
    issuingDepartment: '杭州市住房保障和房产管理局',
    documentNumber: '杭房局〔2019〕50号',
    summary: '杭州市既有住宅加装电梯补助办法，每台电梯补助20万元，市区两级财政各承担一半。',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

interface SubsidyStore {
  policies: SubsidyPolicy[];
  initPolicies: () => void;
  getPolicy: (id: string) => SubsidyPolicy | undefined;
  addPolicy: (
    data: Omit<SubsidyPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ) => string;
  updatePolicy: (
    id: string,
    data: Partial<Omit<SubsidyPolicy, 'id' | 'createdAt'>>
  ) => void;
  deletePolicy: (id: string) => void;
  searchPolicies: (params?: {
    level?: PolicyLevel;
    province?: string;
    city?: string;
    district?: string;
    keyword?: string;
  }) => SubsidyPolicy[];
  getProvinces: () => string[];
  getCities: (province: string) => string[];
  getDistricts: (province: string, city: string) => string[];
}

export const useSubsidyStore = create<SubsidyStore>((set, get) => ({
  policies: [],

  initPolicies: () => {
    try {
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored && storedVersion === String(CURRENT_VERSION)) {
        set({ policies: JSON.parse(stored) });
      } else {
        set({ policies: defaultPolicies });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPolicies));
        localStorage.setItem(
          STORAGE_VERSION_KEY,
          String(CURRENT_VERSION)
        );
      }
    } catch {
      set({ policies: defaultPolicies });
    }
  },

  getPolicy: (id) => {
    return get().policies.find((p) => p.id === id);
  },

  addPolicy: (data) => {
    const policyId = generateId();
    const now = new Date().toISOString();
    const newPolicy: SubsidyPolicy = {
      ...data,
      id: policyId,
      createdAt: now,
      updatedAt: now,
    };

    const policies = [...get().policies, newPolicy];
    set({ policies });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));

    return policyId;
  },

  updatePolicy: (id, data) => {
    const policies = get().policies.map((p) => {
      if (p.id === id) {
        return { ...p, ...data, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    set({ policies });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  },

  deletePolicy: (id) => {
    const policies = get().policies.filter((p) => p.id !== id);
    set({ policies });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  },

  searchPolicies: (params = {}) => {
    const { level, province, city, district, keyword } = params;
    return get().policies.filter((p) => {
      let match = true;

      if (level && p.level !== level) {
        match = false;
      }
      if (province && province !== '全部' && p.province !== province) {
        match = false;
      }
      if (city && city !== '全部' && p.city !== city) {
        match = false;
      }
      if (district && district !== '全部' && p.district !== district) {
        match = false;
      }
      if (keyword) {
        const keywordLower = keyword.toLowerCase();
        const titleMatch = p.title.toLowerCase().includes(keywordLower);
        const summaryMatch = p.summary.toLowerCase().includes(keywordLower);
        const standardMatch = p.subsidyStandard
          .toLowerCase()
          .includes(keywordLower);
        const departmentMatch = p.issuingDepartment
          .toLowerCase()
          .includes(keywordLower);
        if (
          !titleMatch &&
          !summaryMatch &&
          !standardMatch &&
          !departmentMatch
        ) {
          match = false;
        }
      }

      return match;
    });
  },

  getProvinces: () => {
    const provinces = new Set(
      get().policies.map((p) => p.province).filter(Boolean)
    );
    return Array.from(provinces).sort();
  },

  getCities: (province) => {
    if (!province || province === '全部') return [];
    const cities = new Set(
      get()
        .policies.filter((p) => p.province === province)
        .map((p) => p.city)
        .filter(Boolean)
    );
    return Array.from(cities).sort();
  },

  getDistricts: (province, city) => {
    if (!province || !city || province === '全部' || city === '全部')
      return [];
    const districts = new Set(
      get()
        .policies.filter(
          (p) => p.province === province && p.city === city && p.district
        )
        .map((p) => p.district!)
    );
    return Array.from(districts).sort();
  },
}));
