import { Cell, toNano } from "@ton/core";
import { Blockchain } from "@ton/sandbox";
import { hex } from "../build/main.compiled.json";
import { MainContract } from "../wrappers/MainContract";
import "@ton/test-utils";

describe("main.fc contract tests", () => {
  it("should get the proper most recent sender address", async () => {
    const blockchain = await Blockchain.create();
    const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];

    const myContract = blockchain.openContract(await MainContract.createFromConfig({}, codeCell));

    const senderWallet = await blockchain.treasury("sender");

    // Отправляем внутреннее сообщение.
    const sentMessageResult = await myContract.sendInternalMessage(senderWallet.getSender(), toNano("0.05"));

    // Проверяем, что отправка прошла успешно.
    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    // Вызываем getter-метод контракта и проверяем, что вызов был успешным.
    const data = await myContract.getData();

    // Сравниваем результаты, полученные от getter, с адресом from, который мы задали в исходном внутреннем сообщении.
    expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
  });
});
