<!--
 * @Author: junyang.le@hand-china.com
 * @Date: 2022-06-02 15:02:55
 * @LastEditTime: 2022-11-22 11:41:35
 * @LastEditors: junyang.le@hand-china.com
 * @Description: your description
 * @FilePath: \tool\tests\test.vue
-->
<template>
  <p data="神祇">还剩{{ count }}秒</p>
  <span
    ><div>套娃</div>
    末尾</span
  >
</template>

<script>
const vvv = "哼";
export default {
  data() {
    return {
      greeting: "Hello",
      obaoba: this.intl(`fsadf`, { vvv: vvv }).d(`qqq${vvv}`),
      badsf: this.intl("already").d(`已有的`),
      gb: "狗",
    };
  },
  methods: {
    go() {
      console.log("这是注释");
      const def = "我是";
      const condition = true ? "你" : "abc";
      const add = def + "无上" || "上午";
      add = "上面" && "我";
      const obj = {
        a: "阿巴",
        d: or && "阿巴",
      };
      const killList = ["如", "墙"];
      return "结果";
    },
  },
};
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
