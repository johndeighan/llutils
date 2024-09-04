# test.ne

main -> (statement "\n"):+

statement -> "foo" | "bar"
	{%
	function(lData) {
		return lData;
		}
	%}
