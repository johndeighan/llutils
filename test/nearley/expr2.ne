expr ->
	  int "+" int {% ([fst, _, snd]) => fst + snd %}
	| int "-" int {% ([fst, _, snd]) => fst - snd %}
	| int "*" int {% ([fst, _, snd]) => fst * snd %}
	| int "/" int {% ([fst, _, snd]) => fst / snd %}
int -> [0-9]:+ {% d => parseInt(d[0].join("")) %}
