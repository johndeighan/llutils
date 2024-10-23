# text-table.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/text-table'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')

	equal table.hOptions.decPlaces, 2
	equal table.hOptions.parseNumbers, false
	equal table.numCols, 3
	equal table.lColAligns, [
		'left'
		'right'
		'right'
		]
	equal table.lColFormats, [
		undef
		'%.2f'
		'%.2f'
		]
	equal table.lRows, []
	equal table.lColWidths, [0, 0, 0]
	equal table.lColTotals, [undef, undef, undef]
	equal table.lColSubTotals, [undef, undef, undef]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels(['Coffee', 'Jan', 'Feb'])

	equal table.lRows, [
		{
			opcode: 'labels',
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		]
	equal table.lColWidths, [6, 3, 3]
	equal table.lColTotals, [undef, undef, undef]
	equal table.lColSubTotals, [undef, undef, undef]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels ['Coffee', 'Jan', 'Feb']
	table.data   [undef, 30, 40]

	equal table.lRows, [
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		]
	equal table.lColWidths, [6, 5, 5]
	equal table.lColTotals, [undef, 30, 40]
	equal table.lColSubTotals, [undef, 30, 40]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels ['Coffee', 'Jan', 'Feb']
	table.data   [undef, 30, 40]
	table.data   [undef, 130, 40]

	equal table.lRows, [
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		]
	equal table.lColWidths, [6, 6, 5]
	equal table.lColTotals, [undef, 160, 80]
	equal table.lColSubTotals, [undef, 160, 80]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels  ['Coffee', 'Jan', 'Feb']
	table.data    [undef, 30, 40]
	table.data    [undef, 130, 40]

	like table.lRows, [
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		]
	equal table.lColWidths, [6, 6, 5]
	equal table.lColTotals, [undef, 160, 80]
	equal table.lColSubTotals, [undef, 160, 80]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels  ['Coffee', 'Jan', 'Feb']
	table.data    [undef, 30, 40]
	table.data    [undef, 130, 40]
	table.sep     '-'
	table.subtotals()

	equal table.lRows, [
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		{
			opcode: 'sep'
			ch: '-'
			}
		{
			opcode: 'subtotals'
			lRow: ['', '160.00', '80.00']
			}
		]
	equal table.lColWidths, [6, 6, 5]
	equal table.lColTotals, [undef, 160, 80]
	equal table.lColSubTotals, [undef, undef, undef]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels  ['Coffee', 'Jan', 'Feb']
	table.data    [undef, 30, 40]
	table.data    [undef, 130, 40]
	table.sep     '-'
	table.subtotals()
	table.data    [undef, 10, 20]
	table.data    [undef, 1000, 40]

	equal table.lRows, [
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		{
			opcode: 'sep'
			ch: '-'
			}
		{
			opcode: 'subtotals'
			lRow: ['', '160.00', '80.00']
			}
		{
			opcode: 'data'
			lRow: ['', '10.00', '20.00']
			}
		{
			opcode: 'data'
			lRow: ['', '1000.00', '40.00']
			}
		]
	equal table.lColWidths, [6, 7, 5]
	equal table.lColTotals, [undef, 1170, 140]
	equal table.lColSubTotals, [undef, 1010, 60]
	)()

# -------------------------------------------------------------
# NOTE: Pass arrays to labels() and data()

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.labels  ['Coffee', 'Jan', 'Feb']
	table.data    [undef, 30, 40]
	table.data    [undef, 130, 40]
	table.sep     '-'
	table.subtotals()
	table.data    [undef, 10, 20]
	table.data    [undef, 1000, 40]
	table.fullsep '='
	table.totals()

	equal table.lRows, [
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		{
			opcode: 'sep'
			ch: '-'
			}
		{
			opcode: 'subtotals'
			lRow: ['', '160.00', '80.00']
			}
		{
			opcode: 'data'
			lRow: ['', '10.00', '20.00']
			}
		{
			opcode: 'data'
			lRow: ['', '1000.00', '40.00']
			}
		{
			opcode: 'fullsep'
			ch: '='
			}
		{
			opcode: 'totals'
			lRow: ['', '1170.00', '140.00']
			}
		]
	equal table.lColWidths, [6, 7, 6]
	equal table.lColTotals, [undef, 1170, 140]
	equal table.lColSubTotals, [undef, 1010, 60]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.title   'My Expenses'
	table.fullsep '-'
	table.labels  ['Coffee', 'Jan', 'Feb']
	table.data    [undef, 30, 40]
	table.data    [undef, 130, 40]
	table.sep     '-'
	table.subtotals()
	table.data    [undef, 10, 20]
	table.data    [undef, 1000, 40]
	table.fullsep '='
	table.totals()

	equal table.lRows, [
		{
			opcode: 'title'
			title: 'My Expenses'
			align: 'center'
			}
		{
			opcode: 'fullsep'
			ch: '-'
			}
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		{
			opcode: 'sep'
			ch: '-'
			}
		{
			opcode: 'subtotals'
			lRow: ['', '160.00', '80.00']
			}
		{
			opcode: 'data'
			lRow: ['', '10.00', '20.00']
			}
		{
			opcode: 'data'
			lRow: ['', '1000.00', '40.00']
			}
		{
			opcode: 'fullsep'
			ch: '='
			}
		{
			opcode: 'totals'
			lRow: ['', '1170.00', '140.00']
			}
		]
	equal table.lColWidths, [6, 7, 6]
	equal table.lColTotals, [undef, 1170, 140]
	equal table.lColSubTotals, [undef, 1010, 60]
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.title   'My Expenses'
	table.fullsep '-'
	table.labels  ['Coffee', 'Jan', 'Feb']
	table.data    [undef, 30, 40]
	table.data    [undef, 130, 40]
	table.sep     '-'
	table.subtotals()
	table.data    [undef, 10, 20]
	table.data    [undef, 1000, 40]
	table.fullsep '='
	table.totals()
	table.close()

	equal table.lRows, [
		{
			opcode: 'title'
			title: 'My Expenses'
			align: 'center'
			}
		{
			opcode: 'fullsep'
			ch: '-'
			}
		{
			opcode: 'labels'
			lRow: ['Coffee', 'Jan', 'Feb']
			}
		{
			opcode: 'data'
			lRow: ['', '30.00', '40.00']
			}
		{
			opcode: 'data'
			lRow: ['', '130.00', '40.00']
			}
		{
			opcode: 'sep'
			ch: '-'
			lRow: [
				'------'
				'-------'
				'------'
				],
			}
		{
			opcode: 'subtotals'
			lRow: ['', '160.00', '80.00']
			}
		{
			opcode: 'data'
			lRow: ['', '10.00', '20.00']
			}
		{
			opcode: 'data'
			lRow: ['', '1000.00', '40.00']
			}
		{
			opcode: 'fullsep'
			ch: '='
			}
		{
			opcode: 'totals'
			lRow: ['', '1170.00', '140.00']
			}
		]
	equal table.lColWidths, [6, 7, 6]
	equal table.lColTotals, [undef, 1170, 140]
	equal table.lColSubTotals, [undef, 1010, 60]
	equal table.totalWidth, 21
	)()

# -------------------------------------------------------------

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.title   'My Expenses'
	table.fullsep '-'
	table.labels  ['', 'Jan', 'Feb']
	table.sep()
	table.data    ['coffee', 30, 40]
	table.data    ['dining', 130, 40]
	table.sep     '-'
	table.subtotals()
	table.data    ['one time', 10, 20]
	table.data    ['other', 1000, 40]
	table.fullsep '='
	table.totals()
	str = table.asString()

	equal str, """
		      My Expenses
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
		         1170.00 140.00
		"""
	)()

# -------------------------------------------------------------
# --- Test lHide parameter in toString()

(() =>
	table = new TextTable('l r%.2f r%.2f')
	table.title   'My Expenses'
	table.fullsep '-'
	table.labels  ['', 'Jan', 'Feb']
	table.sep()
	table.data    ['coffee', 30, 40]
	table.data    ['dining', 130, 40]
	table.sep     '-'
	table.subtotals()
	table.data    ['one time', 10, 20]
	table.data    ['other', 1000, 40]
	table.fullsep '='
	table.totals()
	str = table.asString('hide=1')   # --- Hide Jan column

	equal str, """
		  My Expenses
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
		         140.00
		"""
	)()

