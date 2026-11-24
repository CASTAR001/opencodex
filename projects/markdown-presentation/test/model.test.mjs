import test from 'node:test'
import assert from 'node:assert/strict'
import {repairs, completedParts} from '../src/model.js'
test('CJK repairs require real syntax and leave explicit destinations and literals intact',()=>{
  const cases=['这段**“OpenCode”**支持','**结论。**紧接下一句','中文 https://example.org/中文。下一句']
  for (const source of cases) assert.equal(repairs(source).length,1)
  for (const source of ['`**结论。**紧接`','\\*\\*结论。\\*\\*紧接','$**结论。**紧接$',
    '[手册](https://example.org/中文。下一句)','<https://example.org/中文。下一句>','**未闭合。'])
    assert.deepEqual(repairs(source),[])
})
test('only the first final text of an explicitly successful run gets a divider',()=>{
  const user={type:'user'},text=text=>({type:'text',text})
  const msg={id:'a',type:'assistant',time:{completed:2},finish:'stop',content:[
    text('progress'),{type:'tool'}, {...text('update'),native:{phase:'commentary'}},text('final'),text('continued')]}
  const idle={type:'idle',outcome:'succeeded'}
  assert.deepEqual([...completedParts([user,msg,user,msg,idle])],['a:text:2'])
  for (const rows of [[user,msg],[msg,idle],[user,msg,{...idle,outcome:'interrupted'}],
    [user,{...msg,error:{}},idle],[user,{...msg,finish:'length'},idle],
    [user,msg,{type:'synthetic'},msg,idle],[user,msg,user,idle]])
    assert.equal(completedParts(rows).size,0)
})
