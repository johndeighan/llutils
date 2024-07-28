import "svelte/internal/disclose-version";

$.mark_module_start();
Card[$.FILENAME] = "src/elements/card.svelte";

import * as $ from "svelte/internal/client";

var root = $.add_locations($.template(`<svelte-options></svelte-options> <h1> </h1>`, 3), Card[$.FILENAME], [[1, 0], [3, 0]]);

export default function Card($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, Card);
	$.validate_prop_bindings($$props, [], [], Card);

	let message = $.source('Hello, my name is John Deighan');
	var fragment = root();
	var svelte_options = $.first_child(fragment);

	$.set_custom_element_data(svelte_options, "customElement", "ca-rd");

	var h1 = $.sibling($.sibling(svelte_options, true));
	var text = $.child(h1);

	$.reset(h1);
	$.template_effect(() => $.set_text(text, $.get(message)));
	$.append($$anchor, fragment);
	return $.pop({ ...$.legacy_api() });
}

$.mark_module_end(Card);
$.create_custom_element(Card, {}, [], [], true);