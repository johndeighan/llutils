import "svelte/internal/disclose-version";
import * as $ from "svelte/internal/client";

var root = $.template(`<h1>A card</h1>`);

export default function Card($$anchor) {
	var h1 = root();

	$.append($$anchor, h1);
}

customElements.define("ca-rd", $.create_custom_element(Card, {}, [], [], true));