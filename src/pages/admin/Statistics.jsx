import { useState } from 'react'
import { Tabs } from 'antd'
import {
  SearchOutlined,
  FileExcelOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import BlurText from '../../components/BlurText'
import SummaryQuery from './SummaryQuery'
import ExcelExport from './ExcelExport'
import BatchDownload from './BatchDownload'

const TAB_ITEMS = [
  {
    key: 'summary-query',
    label: '汇总查询',
    icon: <SearchOutlined />,
    children: <SummaryQuery />,
  },
  {
    key: 'excel-export',
    label: 'Excel 导出',
    icon: <FileExcelOutlined />,
    children: <ExcelExport />,
  },
  {
    key: 'batch-download',
    label: '批量下载',
    icon: <DownloadOutlined />,
    children: <BatchDownload />,
  },
]

export default function Statistics() {
  const [activeTab, setActiveTab] = useState('summary-query')

  return (
    <div>
      <p className="page-intro">
        <BlurText text="统计分析" animateBy="words" delay={80} />
      </p>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={TAB_ITEMS}
        size="large"
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  )
}
