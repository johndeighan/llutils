import {SourceMapConsumer} from 'source-map';

const hMap = {
  version: 3,
  file: "min.js",
  names: ["bar", "baz", "n"],
  sources: ["one.js", "two.js"],
  sourceRoot: "http://example.com/www/js/",
  mappings:
    "CAAC,IAAI,IAAM,SAAUA,GAClB,OAAOC,IAAID;CCDb,IAAI,IAAM,SAAUE,GAClB,OAAOA",
};

const consumer = await new SourceMapConsumer(hMap);

console.log(consumer.sources);

console.log(
	consumer.originalPositionFor({
		line: 2,
		column: 28,
		})
	);

console.log(
	consumer.generatedPositionFor({
		source: "http://example.com/www/js/two.js",
		line: 2,
		column: 10,
		})
	);

// consumer.destroy();
