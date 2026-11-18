// Only this off-thread component constructs the vocabulary, once per active sampler.
import { Tiktoken } from 'js-tiktoken/lite'
import ranks from 'js-tiktoken/ranks/o200k_base'
const tokenizer = new Tiktoken(ranks)
self.onmessage = ({ data }) => self.postMessage(tokenizer.encode(data, [], []).length)
self.postMessage('ready')
