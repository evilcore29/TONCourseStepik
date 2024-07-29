import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from "@ton/core";

// для того чтобы работать с восстановленным контрактом для его тестирования, рекомендуется писать обертки
// для написания обертки по доке Sandbox нужно использовать интерфейс Contract из @ton/core
export class MainContract implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

  static createFromConfig(config: any, code: Cell, workchain = 0) {
    const data = beginCell().endCell();
    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new MainContract(address, init);
  }

  // отправляет внутренее сообщение
  async sendInternalMessage(provider: ContractProvider, sender: Sender, value: bigint) {
    await provider.internal(sender, {
      value, // сумма TON в формате nano
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(), // пустая йчейка
    });
  }

  // геттер который возвращает адрес из c4 хранилища
  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_the_latest_sender", []);
    return {
      recent_sender: stack.readAddress(),
    };
  }
}
