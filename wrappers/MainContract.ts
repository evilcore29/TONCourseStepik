import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from "@ton/core";

export type MainContractConfig = {
  number: number;
  address: Address;
};

export function mainContractConfigToCell(config: MainContractConfig): Cell {
  return beginCell().storeUint(config.number, 32).storeAddress(config.address).endCell();
}

// для того чтобы работать с восстановленным контрактом для его тестирования, рекомендуется писать обертки
// для написания обертки по доке Sandbox нужно использовать интерфейс Contract из @ton/core
export class MainContract implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

  static createFromConfig(config: MainContractConfig, code: Cell, workchain = 0) {
    const data = mainContractConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new MainContract(address, init);
  }

  // отправляет внутренее сообщение
  async sendIncrement(provider: ContractProvider, sender: Sender, value: bigint, increment_by: number) {
    const msg_body = beginCell()
      .storeUint(1, 32) // OP code
      .storeUint(increment_by, 32) // increment_by value
      .endCell();

    await provider.internal(sender, {
      value, // сумма TON в формате nano
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: msg_body,
    });
  }

  // геттер который возвращает адрес из c4 хранилища
  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_contract_storage_data", []);
    return {
      number: stack.readNumber(),
      recent_sender: stack.readAddress(),
    };
  }
}
