import './globals.css'

export const metadata = {
  title: '实习投递追踪',
  description: '管理你的实习申请进度',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
