import { create } from 'zustand';
import type { ElevatorBrand, ElevatorModel } from '@/types';

const STORAGE_KEY = 'elevator_brands';
const STORAGE_VERSION_KEY = 'elevator_brands_version';
const CURRENT_VERSION = 1;

function generateId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 11);
}

const defaultBrands: ElevatorBrand[] = [
  {
    id: 'brand-1',
    name: '奥的斯',
    country: '美国',
    description: '奥的斯电梯公司是世界上最大的电梯公司，1853年创立，产品涵盖电梯、自动扶梯等。',
    models: [
      {
        id: 'model-1-1',
        brandId: 'brand-1',
        modelName: 'Gen2 无机房电梯',
        ratedLoad: 800,
        ratedSpeed: 1.6,
        minFloors: 2,
        maxFloors: 20,
        priceMin: 28,
        priceMax: 45,
        features: ['无机房设计', '节能环保', '运行平稳', '维护方便'],
        remarks: '适用于老旧小区加装，顶层高度要求较低',
      },
      {
        id: 'model-1-2',
        brandId: 'brand-1',
        modelName: 'Regen 能量回馈电梯',
        ratedLoad: 1000,
        ratedSpeed: 2.0,
        minFloors: 5,
        maxFloors: 30,
        priceMin: 45,
        priceMax: 70,
        features: ['能量回馈技术', '智能控制系统', '高效节能'],
        remarks: '中高端产品，节能效果显著',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'brand-2',
    name: '三菱',
    country: '日本',
    description: '三菱电机是日本知名电梯品牌，以高品质、高可靠性著称。',
    models: [
      {
        id: 'model-2-1',
        brandId: 'brand-2',
        modelName: 'ELENESSA 无机房电梯',
        ratedLoad: 800,
        ratedSpeed: 1.5,
        minFloors: 2,
        maxFloors: 15,
        priceMin: 30,
        priceMax: 50,
        features: ['永磁同步无齿轮', '低噪音运行', '节能环保', '安全可靠'],
        remarks: '经典无机房产品，市场占有率高',
      },
      {
        id: 'model-2-2',
        brandId: 'brand-2',
        modelName: 'NEXWAY 小机房电梯',
        ratedLoad: 1000,
        ratedSpeed: 1.75,
        minFloors: 3,
        maxFloors: 25,
        priceMin: 35,
        priceMax: 60,
        features: ['小机房设计', '智能群控', '舒适乘坐体验'],
        remarks: '适合中高层住宅，性价比高',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'brand-3',
    name: '通力',
    country: '芬兰',
    description: '通力电梯是全球领先的电梯和自动扶梯供应商之一，以创新技术闻名。',
    models: [
      {
        id: 'model-3-1',
        brandId: 'brand-3',
        modelName: 'MonoSpace 无机房电梯',
        ratedLoad: 630,
        ratedSpeed: 1.0,
        minFloors: 2,
        maxFloors: 10,
        priceMin: 25,
        priceMax: 38,
        features: ['无机房设计', '一体化驱动主机', '安装快捷', '维护简便'],
        remarks: '专为低层建筑设计，老旧小区加装首选',
      },
      {
        id: 'model-3-2',
        brandId: 'brand-3',
        modelName: 'MiniSpace 小机房电梯',
        ratedLoad: 1000,
        ratedSpeed: 1.6,
        minFloors: 3,
        maxFloors: 20,
        priceMin: 32,
        priceMax: 55,
        features: ['小机房设计', '高效节能', '智能诊断系统'],
        remarks: '通用性强，适合多种建筑类型',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'brand-4',
    name: '日立',
    country: '日本',
    description: '日立电梯是日本知名品牌，产品稳定可靠，售后服务完善。',
    models: [
      {
        id: 'model-4-1',
        brandId: 'brand-4',
        modelName: 'UAX 无机房电梯',
        ratedLoad: 800,
        ratedSpeed: 1.5,
        minFloors: 2,
        maxFloors: 16,
        priceMin: 26,
        priceMax: 42,
        features: ['无机房设计', '永磁同步电机', '低能耗', '安全性高'],
        remarks: '经典无机房系列，品质稳定',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'brand-5',
    name: '康力',
    country: '中国',
    description: '康力电梯是国产电梯龙头企业，产品性价比高，服务网络完善。',
    models: [
      {
        id: 'model-5-1',
        brandId: 'brand-5',
        modelName: 'KLW 无机房电梯',
        ratedLoad: 800,
        ratedSpeed: 1.0,
        minFloors: 2,
        maxFloors: 12,
        priceMin: 18,
        priceMax: 28,
        features: ['国产精品', '性价比高', '服务网点多', '维修方便'],
        remarks: '国产优质品牌，预算有限的理想选择',
      },
      {
        id: 'model-5-2',
        brandId: 'brand-5',
        modelName: 'KLDS 观光电梯',
        ratedLoad: 1000,
        ratedSpeed: 1.5,
        minFloors: 3,
        maxFloors: 15,
        priceMin: 25,
        priceMax: 40,
        features: ['全景观光', '钢结构井道', '时尚外观'],
        remarks: '适合景观建筑，外观美观大方',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'brand-6',
    name: '江南嘉捷',
    country: '中国',
    description: '江南嘉捷是国内知名电梯品牌，专注于电梯研发、制造和销售。',
    models: [
      {
        id: 'model-6-1',
        brandId: 'brand-6',
        modelName: 'SJG 无机房电梯',
        ratedLoad: 630,
        ratedSpeed: 1.0,
        minFloors: 2,
        maxFloors: 10,
        priceMin: 15,
        priceMax: 25,
        features: ['经济实惠', '运行稳定', '维护成本低'],
        remarks: '经济型产品，适合预算紧张的项目',
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

interface ElevatorStore {
  brands: ElevatorBrand[];
  initBrands: () => void;
  getBrand: (id: string) => ElevatorBrand | undefined;
  getModel: (modelId: string) => { model: ElevatorModel; brand: ElevatorBrand } | null;
  addBrand: (data: Omit<ElevatorBrand, 'id' | 'createdAt' | 'updatedAt' | 'models'>) => string;
  updateBrand: (id: string, data: Partial<Omit<ElevatorBrand, 'id' | 'createdAt' | 'models'>>) => void;
  deleteBrand: (id: string) => void;
  addModel: (brandId: string, data: Omit<ElevatorModel, 'id' | 'brandId'>) => string;
  updateModel: (modelId: string, data: Partial<Omit<ElevatorModel, 'id' | 'brandId'>>) => void;
  deleteModel: (modelId: string) => void;
  searchModels: (params?: {
    minFloors?: number;
    maxFloors?: number;
    ratedLoad?: number;
    keyword?: string;
  }) => { brand: ElevatorBrand; model: ElevatorModel }[];
}

export const useElevatorStore = create<ElevatorStore>((set, get) => ({
  brands: [],

  initBrands: () => {
    try {
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored && storedVersion === String(CURRENT_VERSION)) {
        set({ brands: JSON.parse(stored) });
      } else {
        set({ brands: defaultBrands });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBrands));
        localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_VERSION));
      }
    } catch {
      set({ brands: defaultBrands });
    }
  },

  getBrand: (id) => {
    return get().brands.find((b) => b.id === id);
  },

  getModel: (modelId) => {
    for (const brand of get().brands) {
      const model = brand.models.find((m) => m.id === modelId);
      if (model) {
        return { model, brand };
      }
    }
    return null;
  },

  addBrand: (data) => {
    const brandId = generateId();
    const now = new Date().toISOString();
    const newBrand: ElevatorBrand = {
      ...data,
      id: brandId,
      models: [],
      createdAt: now,
      updatedAt: now,
    };

    const brands = [...get().brands, newBrand];
    set({ brands });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));

    return brandId;
  },

  updateBrand: (id, data) => {
    const brands = get().brands.map((b) => {
      if (b.id === id) {
        return { ...b, ...data, updatedAt: new Date().toISOString() };
      }
      return b;
    });
    set({ brands });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  },

  deleteBrand: (id) => {
    const brands = get().brands.filter((b) => b.id !== id);
    set({ brands });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  },

  addModel: (brandId, data) => {
    const modelId = generateId();
    const newModel: ElevatorModel = {
      ...data,
      id: modelId,
      brandId,
    };

    const brands = get().brands.map((b) => {
      if (b.id === brandId) {
        return {
          ...b,
          models: [...b.models, newModel],
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });
    set({ brands });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));

    return modelId;
  },

  updateModel: (modelId, data) => {
    const brands = get().brands.map((b) => {
      const hasModel = b.models.some((m) => m.id === modelId);
      if (!hasModel) return b;

      return {
        ...b,
        models: b.models.map((m) => {
          if (m.id === modelId) {
            return { ...m, ...data };
          }
          return m;
        }),
        updatedAt: new Date().toISOString(),
      };
    });
    set({ brands });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  },

  deleteModel: (modelId) => {
    const brands = get().brands.map((b) => {
      const hasModel = b.models.some((m) => m.id === modelId);
      if (!hasModel) return b;

      return {
        ...b,
        models: b.models.filter((m) => m.id !== modelId),
        updatedAt: new Date().toISOString(),
      };
    });
    set({ brands });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  },

  searchModels: (params = {}) => {
    const { minFloors, maxFloors, ratedLoad, keyword } = params;
    const results: { brand: ElevatorBrand; model: ElevatorModel }[] = [];

    for (const brand of get().brands) {
      for (const model of brand.models) {
        let match = true;

        if (minFloors !== undefined && model.minFloors > minFloors) {
          match = false;
        }
        if (maxFloors !== undefined && model.maxFloors < maxFloors) {
          match = false;
        }
        if (ratedLoad !== undefined && model.ratedLoad < ratedLoad) {
          match = false;
        }
        if (keyword) {
          const keywordLower = keyword.toLowerCase();
          const brandMatch = brand.name.toLowerCase().includes(keywordLower);
          const modelMatch = model.modelName.toLowerCase().includes(keywordLower);
          const featureMatch = model.features.some((f) =>
            f.toLowerCase().includes(keywordLower)
          );
          if (!brandMatch && !modelMatch && !featureMatch) {
            match = false;
          }
        }

        if (match) {
          results.push({ brand, model });
        }
      }
    }

    return results;
  },
}));
