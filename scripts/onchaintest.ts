import { Address, Cell, contractAddress, toNano, TonClient4 } from "@ton/ton";
import { hex } from "../build/main.compiled.json";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import qs from "qs";
import qrcode from "qrcode-terminal";

async function onchainTestScript() {
  const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];
  const dataCell = new Cell();

  // * вычисляем адрес контракта
  const address = contractAddress(0, { code: codeCell, data: dataCell });

  // * написано что это для подключения к API какогото протокола v4
  // * а это типа апи для подключения к блокчейну (Scallable and CDN-friendly HTTP API for TON blockchain.)
  // * https://github.com/ton-community/ton-api-v4
  const endpoint = await getHttpV4Endpoint({
    network: "testnet",
  });
  const client4 = new TonClient4({ endpoint });

  // * получаем инфу о последнем блоке
  const latestBlock = await client4.getLastBlock();
  let status = await client4.getAccount(latestBlock.last.seqno, address);

  if (status.account.state.type !== "active") {
    console.log("Contract is not active");
    return;
  }
  // * Один TON равен 1 000 000 000 (одному миллиарду) нано.
  // ? что происходит внутри setInterval
  // настраиваем повторение этой функции каждые 2 секунды;
  // при каждой проверке нам нужно получить порядковый номер последнего блока с помощью getLastBlock;
  // мы используем runMethod для вызова нашего getter-метода, нас интересуют параметры exitCode и result;
  // мы убеждаемся, что скрипт остановится, если вызов не был успешным или полученные данные не относятся к типу slice (как вы помните, адрес в TON — это всегда slice);
  // мы берем результат метода get, а точнее его первый элемент (здесь result — это массив, так как в других случаях может быть несколько результатов, возвращаемых методом getter);
  // мы берем параметр cell из result, открываем его для парсинга и читаем из него адрес;
  // мы сравниваем версию строки адреса со строкой, содержащей возможный адрес предыдущего отправителя, которую мы получили; если они не равны, то выводим в консольный лог адрес нового последнего отправителя.

  let link =
    `https://test.tonhub.com/transfer/` +
    address.toString({
      testOnly: true,
    }) +
    "?" +
    qs.stringify({
      text: "Simple test transaction",
      amount: toNano(1).toString(10),
    });

  qrcode.generate(link, { small: true }, (code) => {
    console.log(code);
  });

  let recent_sender_archive: Address;

  setInterval(async () => {
    const latestBlock = await client4.getLastBlock();
    const { exitCode, result } = await client4.runMethod(latestBlock.last.seqno, address, "get_the_latest_sender");

    if (exitCode !== 0) {
      console.log("Running getter method failed");
      return;
    }
    if (result[0].type !== "slice") {
      console.log("Unknown result type");
      return;
    }

    let most_recent_sender = result[0].cell.beginParse().loadAddress();

    if (most_recent_sender && most_recent_sender.toString() !== recent_sender_archive?.toString()) {
      console.log("New recent sender found: " + most_recent_sender.toString({ testOnly: true }));
      recent_sender_archive = most_recent_sender;
    }
  }, 2000);
}

onchainTestScript();
