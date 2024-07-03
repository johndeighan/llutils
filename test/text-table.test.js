  // text-table.test.coffee
import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/text-table';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  u.equal(table.hOptions.decPlaces, 2);
  u.equal(table.hOptions.parseNumbers, false);
  u.equal(table.numCols, 3);
  u.equal(table.lColAligns, ['left', 'right', 'right']);
  u.equal(table.lColFormats, [undef, '%.2f', '%.2f']);
  u.equal(table.lRows, []);
  u.equal(table.lColWidths, [0, 0, 0]);
  u.equal(table.lColTotals, [undef, undef, undef]);
  return u.equal(table.lColSubTotals, [undef, undef, undef]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  u.equal(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    }
  ]);
  u.equal(table.lColWidths, [6, 3, 3]);
  u.equal(table.lColTotals, [undef, undef, undef]);
  return u.equal(table.lColSubTotals, [undef, undef, undef]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  u.equal(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 5, 5]);
  u.equal(table.lColTotals, [undef, 30, 40]);
  return u.equal(table.lColSubTotals, [undef, 30, 40]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  u.equal(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 6, 5]);
  u.equal(table.lColTotals, [undef, 160, 80]);
  return u.equal(table.lColSubTotals, [undef, 160, 80]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  u.like(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 6, 5]);
  u.equal(table.lColTotals, [undef, 160, 80]);
  return u.equal(table.lColSubTotals, [undef, 160, 80]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  table.sep('-');
  table.subtotals();
  u.equal(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    },
    {
      opcode: 'sep',
      ch: '-'
    },
    {
      opcode: 'subtotals',
      lRow: ['',
    '160.00',
    '80.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 6, 5]);
  u.equal(table.lColTotals, [undef, 160, 80]);
  return u.equal(table.lColSubTotals, [undef, undef, undef]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  table.sep('-');
  table.subtotals();
  table.data([undef, 10, 20]);
  table.data([undef, 1000, 40]);
  u.equal(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    },
    {
      opcode: 'sep',
      ch: '-'
    },
    {
      opcode: 'subtotals',
      lRow: ['',
    '160.00',
    '80.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '10.00',
    '20.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '1000.00',
    '40.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 7, 5]);
  u.equal(table.lColTotals, [undef, 1170, 140]);
  return u.equal(table.lColSubTotals, [undef, 1010, 60]);
})();

// -------------------------------------------------------------
// NOTE: Pass arrays to labels() and data()
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  table.sep('-');
  table.subtotals();
  table.data([undef, 10, 20]);
  table.data([undef, 1000, 40]);
  table.fullsep('=');
  table.totals();
  u.equal(table.lRows, [
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    },
    {
      opcode: 'sep',
      ch: '-'
    },
    {
      opcode: 'subtotals',
      lRow: ['',
    '160.00',
    '80.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '10.00',
    '20.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '1000.00',
    '40.00']
    },
    {
      opcode: 'fullsep',
      ch: '='
    },
    {
      opcode: 'totals',
      lRow: ['',
    '1170.00',
    '140.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 7, 6]);
  u.equal(table.lColTotals, [undef, 1170, 140]);
  return u.equal(table.lColSubTotals, [undef, 1010, 60]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.title('My Expenses');
  table.fullsep('-');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  table.sep('-');
  table.subtotals();
  table.data([undef, 10, 20]);
  table.data([undef, 1000, 40]);
  table.fullsep('=');
  table.totals();
  u.equal(table.lRows, [
    {
      opcode: 'title',
      title: 'My Expenses',
      align: 'center'
    },
    {
      opcode: 'fullsep',
      ch: '-'
    },
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    },
    {
      opcode: 'sep',
      ch: '-'
    },
    {
      opcode: 'subtotals',
      lRow: ['',
    '160.00',
    '80.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '10.00',
    '20.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '1000.00',
    '40.00']
    },
    {
      opcode: 'fullsep',
      ch: '='
    },
    {
      opcode: 'totals',
      lRow: ['',
    '1170.00',
    '140.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 7, 6]);
  u.equal(table.lColTotals, [undef, 1170, 140]);
  return u.equal(table.lColSubTotals, [undef, 1010, 60]);
})();

// -------------------------------------------------------------
(() => {
  var table;
  table = new TextTable('l r%.2f r%.2f');
  table.title('My Expenses');
  table.fullsep('-');
  table.labels(['Coffee', 'Jan', 'Feb']);
  table.data([undef, 30, 40]);
  table.data([undef, 130, 40]);
  table.sep('-');
  table.subtotals();
  table.data([undef, 10, 20]);
  table.data([undef, 1000, 40]);
  table.fullsep('=');
  table.totals();
  table.close();
  u.equal(table.lRows, [
    {
      opcode: 'title',
      title: 'My Expenses',
      align: 'center'
    },
    {
      opcode: 'fullsep',
      ch: '-'
    },
    {
      opcode: 'labels',
      lRow: ['Coffee',
    'Jan',
    'Feb']
    },
    {
      opcode: 'data',
      lRow: ['',
    '30.00',
    '40.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '130.00',
    '40.00']
    },
    {
      opcode: 'sep',
      ch: '-',
      lRow: ['------',
    '-------',
    '------']
    },
    {
      opcode: 'subtotals',
      lRow: ['',
    '160.00',
    '80.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '10.00',
    '20.00']
    },
    {
      opcode: 'data',
      lRow: ['',
    '1000.00',
    '40.00']
    },
    {
      opcode: 'fullsep',
      ch: '='
    },
    {
      opcode: 'totals',
      lRow: ['',
    '1170.00',
    '140.00']
    }
  ]);
  u.equal(table.lColWidths, [6, 7, 6]);
  u.equal(table.lColTotals, [undef, 1170, 140]);
  u.equal(table.lColSubTotals, [undef, 1010, 60]);
  return u.equal(table.totalWidth, 21);
})();

// -------------------------------------------------------------
(() => {
  var str, table;
  table = new TextTable('l r%.2f r%.2f');
  table.title('My Expenses');
  table.fullsep('-');
  table.labels(['', 'Jan', 'Feb']);
  table.sep();
  table.data(['coffee', 30, 40]);
  table.data(['dining', 130, 40]);
  table.sep('-');
  table.subtotals();
  table.data(['one time', 10, 20]);
  table.data(['other', 1000, 40]);
  table.fullsep('=');
  table.totals();
  str = table.asString();
  return u.equal(str, `      My Expenses
-----------------------
           Jan    Feb
-------- ------- ------
coffee     30.00  40.00
dining    130.00  40.00
-------- ------- ------
          160.00  80.00
one time   10.00  20.00
other    1000.00  40.00
=======================
         1170.00 140.00`);
})();

// -------------------------------------------------------------
// --- Test lHide parameter in toString()
(() => {
  var str, table;
  table = new TextTable('l r%.2f r%.2f');
  table.title('My Expenses');
  table.fullsep('-');
  table.labels(['', 'Jan', 'Feb']);
  table.sep();
  table.data(['coffee', 30, 40]);
  table.data(['dining', 130, 40]);
  table.sep('-');
  table.subtotals();
  table.data(['one time', 10, 20]);
  table.data(['other', 1000, 40]);
  table.fullsep('=');
  table.totals();
  str = table.asString('hide=1'); // --- Hide Jan column
  return u.equal(str, `  My Expenses
---------------
          Feb
-------- ------
coffee    40.00
dining    40.00
-------- ------
          80.00
one time  20.00
other     40.00
===============
         140.00`);
})();

//# sourceMappingURL=text-table.test.js.map
