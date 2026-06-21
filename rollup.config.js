import resolve from '@rollup/plugin-node-resolve';
import banner from 'rollup-plugin-banner2';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/BilibiliFavsManage.user.js',
    format: 'iife',
    name: 'BilibiliFavsManager'
  },
  plugins: [
    resolve(),
    banner(() => {
      return `// ==UserScript==
// @name         Bilibili 收藏夹批量管理
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  批量复制 B 站收藏夹（适配新版 VUI 组件库）
// @author       Your Name
// @match        https://space.bilibili.com/*/favlist*
// @grant        none
// @license      MIT
// ==/UserScript==

`;
    }),
    // 可选：压缩代码（开发时可以注释掉）
    // terser({
    //   format: {
    //     comments: /^!/
    //   }
    // })
  ]
};
