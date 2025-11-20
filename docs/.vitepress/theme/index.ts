import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import FetchDemo from '../../components/FetchDemo.vue'
import AxiosFetchDemo from '../../components/AxiosFetchDemo.vue'
import TableRequestDemo from '../../components/TableRequestDemo.vue'
import TableStaticDemo from '../../components/TableStaticDemo.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('FetchDemo', FetchDemo)
    app.component('AxiosFetchDemo', AxiosFetchDemo)
    app.component('TableRequestDemo', TableRequestDemo)
    app.component('TableStaticDemo', TableStaticDemo)
  }
}

