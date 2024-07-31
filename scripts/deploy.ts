import { hex } from "../build/main.compiled.json";
import { beginCell, Cell, contractAddress, StateInit, storeStateInit, toNano } from "@ton/ton";
import qs from "qs";
import qrcode from "qrcode-terminal";

import dotenv from "dotenv";
dotenv.config();

async function deployScript() {
  console.log("=================================================================");
  console.log("Deploy script is running, let's deploy our main.fc contract...");

  const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];
  const dataCell = new Cell();

  // * Как вы помните, для развертывания контракта нам необходимо:
  // Вычислить будущий адрес контракта.
  // Создать исходное состояние контракта (код и исходные данные).
  // Составить сообщение с исходным состоянием.
  // Отправить это сообщение на будущий адрес контракта в блокчейне.

  // * Создать исходное состояние контракта (код и исходные данные).
  const stateInit: StateInit = {
    code: codeCell,
    data: dataCell,
  };

  const stateInitBuilder = beginCell();
  // * Составить сообщение с исходным состоянием.
  storeStateInit(stateInit)(stateInitBuilder);
  const stateInitCell = stateInitBuilder.endCell();

  // * Вычислить будущий адрес контракта.
  const address = contractAddress(0, {
    code: codeCell,
    data: dataCell,
  });

  console.log(`The address of the contract is following: ${address.toString()}`);
  console.log(process.env.TESTNET);
  console.log(`Please scan the QR code below to deploy the contract to ${process.env.TESTNET ? "testnet" : "mainnet"}:`);

  let link =
    `https://${process.env.TESTNET ? "testnet." : ""}tonhub.com/transfer/` +
    address.toString({
      testOnly: process.env.TESTNET ? true : false,
    }) +
    "?" +
    qs.stringify({
      text: "Deploy contract",
      amount: toNano(1).toString(10),
      init: stateInitCell.toBoc({ idx: false }).toString("base64"),
    });

  qrcode.generate(link, { small: true }, (code) => {
    console.log(code);
  });
}

deployScript();
