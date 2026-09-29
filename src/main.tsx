import 'pretendard/dist/web/static/pretendard.css'
// 텍스트 박스에서 고를 수 있는 한글 글꼴 (src/lib/richText.ts 의 fontOptions). 한글 구간별로 나뉘어 쓰는 글자만 내려받는다
import '@fontsource/nanum-myeongjo/400.css'
import '@fontsource/nanum-myeongjo/800.css'
import '@fontsource/gowun-dodum/400.css'
import '@fontsource/black-han-sans/400.css'
import '@fontsource/nanum-pen-script/400.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
