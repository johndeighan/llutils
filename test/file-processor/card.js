import "svelte/internal/disclose-version";

$.mark_module_start();
Card[$.FILENAME] = "test/file-processor/card.svelte";

import * as $ from "svelte/internal/client";

var root = $.add_locations($.template(`<h1> </h1>`), Card[$.FILENAME], [[3, 0]]);

export default function Card($$anchor, $$props) {
	$.check_target(new.target);
	$.push($$props, true, Card);
	$.validate_prop_bindings($$props, [], [], Card);

	let message = $.source('Hello, my name is John Deighan');
	var h1 = root();
	var text = $.child(h1);

	$.reset(h1);
	$.template_effect(() => $.set_text(text, $.get(message)));
	$.append($$anchor, h1);
	return $.pop({ ...$.legacy_api() });
}

$.mark_module_end(Card);
customElements.define("ca-rd", $.create_custom_element(Card, {}, [], [], true));