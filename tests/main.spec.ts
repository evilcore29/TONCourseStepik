import { Cell, toNano } from "@ton/core";
import { hex } from "../build/main.compiled.json";
import { MainContract } from "../wrappers/MainContract";
import "@ton/test-utils";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { compile } from "@ton/blueprint";

describe("main.fc contract tests", () => {
  let blockchain: Blockchain;
  let myContract: SandboxContract<MainContract>;
  let initWallet: SandboxContract<TreasuryContract>;
  let ownerWallet: SandboxContract<TreasuryContract>;
  let codeCell: Cell;

  // компиляция из blueprint
  beforeAll(async () => {
    codeCell = await compile("MainContract");
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();

    initWallet = await blockchain.treasury("initAddress");
    ownerWallet = await blockchain.treasury("ownerAddress");

    myContract = blockchain.openContract(
      await MainContract.createFromConfig(
        {
          number: 0,
          address: initWallet.address,
          owner_address: ownerWallet.address,
        },
        codeCell
      )
    );
  });

  it("should get the proper most recent sender address", async () => {
    const senderWallet = await blockchain.treasury("sender");

    // Отправляем внутреннее сообщение.
    const sentMessageResult = await myContract.sendIncrement(senderWallet.getSender(), toNano("0.05"), 1);

    // Проверяем, что отправка прошла успешно.
    expect(sentMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    // Вызываем getter-метод контракта и проверяем, что вызов был успешным.
    const data = await myContract.getData();

    // Сравниваем результаты, полученные от getter, с адресом from, который мы задали в исходном внутреннем сообщении.MainContract.ts
    expect(data.recent_sender.toString()).toBe(senderWallet.address.toString());
    expect(data.number).toEqual(1);
  });

  it("successfully deposits funds", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const depositMessageResult = await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    expect(depositMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const balanceRequest = await myContract.getBalance();

    // expect(balanceRequest.number).toBeGreaterThan(toNano("4.99"));
    expect(balanceRequest).toBeGreaterThan(toNano("4.99"));
  });

  it("should return funds as no command is sent", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const depositMessageResult = await myContract.sendNoCodeDeposit(senderWallet.getSender(), toNano("5"));

    expect(depositMessageResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: senderWallet.address,
      success: true,
    });

    const balanceRequest = await myContract.getBalance();

    // expect(balanceRequest.number).toBe(0);
    expect(balanceRequest).toBe(0);
  });

  it("successfully withdraws funds on behalf of owner", async () => {
    const senderWallet = await blockchain.treasury("sender");

    await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(ownerWallet.getSender(), toNano("0.05"), toNano("1"));

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: ownerWallet.address,
      success: true,
      value: toNano(1),
    });
  });

  it("fails to withdraw funds on behalf of not-owner", async () => {
    const senderWallet = await blockchain.treasury("sender");

    await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(senderWallet.getSender(), toNano("0.5"), toNano("1"));

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 103,
    });
  });

  it("fails to withdraw funds because lack of balance", async () => {
    const withdrawalRequestResult = await myContract.sendWithdrawalRequest(ownerWallet.getSender(), toNano("0.5"), toNano("1"));

    expect(withdrawalRequestResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: false,
      exitCode: 104,
    });
  });
});
