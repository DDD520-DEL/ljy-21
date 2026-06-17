## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层 (Frontend)"
        A["React 18 + TypeScript"]
        B["Vite 构建工具"]
        C["React Router DOM 路由"]
        D["Zustand 状态管理"]
        E["Tailwind CSS 样式"]
        F["Lucide React 图标"]
    end
    
    subgraph "数据层 (Data)"
        G["LocalStorage 持久化"]
        H["Mock 模拟数据"]
    end
    
    A --> C
    A --> D
    A --> E
    A --> F
    B --> A
    D --> G
    D --> H
```

## 2. 技术说明
- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite@5
- **路由管理**：React Router DOM@6
- **状态管理**：Zustand@4
- **样式方案**：Tailwind CSS@3
- **图标库**：Lucide React
- **数据存储**：LocalStorage（前端持久化）+ Mock 数据（演示用）
- **项目初始化**：使用 react-ts 模板（纯前端项目，无需后端）

## 3. 路由定义
| 路由 | 用途 |
|-------|---------|
| / | 项目列表首页 |
| /projects/create | 创建新项目 |
| /projects/:id | 项目详情（概览） |
| /projects/:id/households | 住户信息与费用分摊 |
| /projects/:id/survey | 意见征询 |
| /projects/:id/progress | 进度公示 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PROJECT ||--o{ HOUSEHOLD : "包含"
    PROJECT ||--o{ SURVEY_RESPONSE : "包含"
    PROJECT ||--o{ PROGRESS_NODE : "包含"
    PROGRESS_NODE ||--o{ MEDIA_FILE : "包含"
    
    PROJECT {
        string id "项目ID"
        string name "小区+单元名称"
        string address "小区地址"
        int totalFloors "总楼层数"
        float totalCost "总费用(万元)"
        string status "项目状态"
        string createdAt "创建时间"
    }
    
    HOUSEHOLD {
        string id "住户ID"
        string projectId "所属项目ID"
        int floor "楼层"
        string unit "室号"
        float area "建筑面积(㎡)"
        string ownerName "户主姓名"
        string phone "联系电话"
        float shareRatio "分摊比例(%)"
        float shareAmount "分摊金额(元)"
    }
    
    SURVEY_RESPONSE {
        string id "响应ID"
        string projectId "项目ID"
        string householdId "住户ID"
        string opinion "意见类型"
        string reason "理由"
        string signedAt "签署时间"
    }
    
    PROGRESS_NODE {
        string id "节点ID"
        string projectId "项目ID"
        string stage "阶段名称"
        string description "节点描述"
        string date "完成日期"
        string status "节点状态"
    }
    
    MEDIA_FILE {
        string id "文件ID"
        string nodeId "节点ID"
        string type "类型(photo/file)"
        string name "文件名"
        string url "文件地址"
    }
```

### 4.2 费用分摊算法

根据楼层系数法自动计算分摊比例：
- 1 层：0%（不分摊）
- 2 层：基础比例 8%
- 3 层及以上：每层递增，如 3层=12%，4层=16%，5层=20%，6层=24%...
- 同层多户：按面积比例分摊该层总比例

### 4.3 状态枚举
- **项目状态**：`draft`(草稿) → `surveying`(征询中) → `approved`(已立项) → `planning`(方案公示) → `bidding`(施工招标) → `constructing`(施工中) → `completed`(已竣工)
- **意见类型**：`agree`(同意) / `oppose`(反对) / `abstain`(弃权)
- **节点状态**：`pending`(待开始) / `in_progress`(进行中) / `completed`(已完成)

## 5. 目录结构

```
src/
├── components/          # 通用组件
│   ├── Layout/         # 布局组件
│   ├── ProjectCard/    # 项目卡片
│   ├── ProgressTimeline/ # 进度时间线
│   ├── SurveyChart/    # 征询进度图表
│   └── FileUploader/   # 文件上传组件
├── pages/              # 页面组件
│   ├── Home/           # 首页-项目列表
│   ├── CreateProject/  # 创建项目
│   ├── ProjectDetail/  # 项目详情
│   ├── Households/     # 住户与费用分摊
│   ├── Survey/         # 意见征询
│   └── Progress/       # 进度公示
├── store/              # Zustand 状态管理
│   └── projectStore.ts
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── feeCalculator.ts # 费用分摊计算
│   ├── maskData.ts      # 数据脱敏
│   └── mockData.ts      # Mock 数据
├── App.tsx
├── main.tsx
└── index.css
```
