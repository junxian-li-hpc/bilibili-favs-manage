import resolve from '@rollup/plugin-node-resolve';
import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';

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
// @version      2.0
// @description  批量复制 B 站收藏夹（复选框列表 + 跨页面流程 + 过滤"我追的"）
// @author       Your Name
// @match        https://space.bilibili.com/*/favlist*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
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
