import {
	renderToStream,
	type RenderToStreamOptions,
} from "@builder.io/qwik/server";
import { manifest } from "@qwik-client-manifest";
import Root from "./root";

export default function (opts: RenderToStreamOptions) {
	return renderToStream(<Root />, {
		manifest,
		...opts,

		// needed for reframing/fragmenting
		containerTagName: "qwik-fragment",
		qwikLoader: {
			include: "always",
			position: "bottom",
		},

		// Use container attributes to set attributes on the html tag.
		containerAttributes: {
			lang: "en-us",
			...opts.containerAttributes,
		},
		serverData: {
			...opts.serverData,
		},
	});
}
