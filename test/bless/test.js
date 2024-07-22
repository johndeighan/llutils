var hAST;

import {
  undef
} from '@jdeighan/llutils';

hAST = {
  "type": "program",
  "name": "John"
};

equal(extract(hAST, `type="program"`), {
  name: 'John'
});