import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";

var root = $.template(`<h1>A bogus element</h1>`);

export default function Bogus($$anchor) {
	var h1 = root();

	$.append($$anchor, h1);
}

customElements.define("bogus-elem", $.create_custom_element(Bogus, {}, [], [], true));