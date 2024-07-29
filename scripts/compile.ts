import * as fs from "fs";
import process from "process";
import { Cell } from "@ton/core";
import { compileFunc } from "@ton-community/func-js";

async function compileScript() {
  console.log("=================================================================");
  console.log("Compile script is running, let's find some FunC code to compile...");

  // * компилируем то что есть в файле контракта
  // * Результат компиляции будет представлен в виде BOC (Body of Cell) в строке формата base64. Если мы в дальнейшем планируем работать с этим скомпилированным контрактом локально (создавая тесты), нам нужно создать ячейку, в которой этот BOC сохранится для будущего использования.

  const compileResult = await compileFunc({
    targets: ["./contracts/main.fc"],
    sources: (x) => fs.readFileSync(x).toString("utf8"),
  });
  // console.log("🚀 ~ file: compile.ts:37 ~ compileScript ~ compileResult:", compileResult);

  // * ловим ошибки если они есть на этапе компиляции контракта
  if (compileResult.status === "error") {
    console.log(" - OH NO! Compilation Errors! The compiler output was:");
    console.log(`\n${compileResult.message}`);
    process.exit(1);
  }

  console.log(" - Compilation successful!");

  // * путь для сохранения скомпилированного кода
  const hexArtifact = `build/main.compiled.json`;

  // * cохранение скомпилированного кода
  // * Конструктор ячеек (Cell) предусматривает метод .fromBoc, который получает буфер, так что мы предоставим ему буфер в виде BOC (Body of Cell) в строке формата base64. Когда мы создадим ячейку из BOC, нам также потребуется создать шестнадцатеричное представление этой ячейки и сохранить его в JSON-файле.
  const cellFromBoc = Cell.fromBoc(Buffer.from(compileResult.codeBoc, "base64"))[0];
  // console.log("🚀 ~ file: compile.ts:42 ~ compileScript ~ cellFromBoc:", cellFromBoc);
  fs.writeFileSync(hexArtifact, JSON.stringify({ hex: cellFromBoc.toBoc().toString("hex") }));

  console.log(" - Compiled code saved to " + hexArtifact);
}

compileScript();
