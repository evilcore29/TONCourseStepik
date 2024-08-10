import { address, toNano } from "@ton/core";
import { MainContract } from "../wrappers/MainContract";
import { compile, NetworkProvider } from "@ton/blueprint";

// * Все ваши скрипты должны экспортировать функцию run, если вы хотите, чтобы они работали с Blueprint

// * deployed with tonkeeper https://testnet.tonscan.org/address/EQDAbnsqALKAoQO5uS1qOI8X7OhkeDnv3hZiqg2VAqhPa6xN#transactions
// * EQDAbnsqALKAoQO5uS1qOI8X7OhkeDnv3hZiqg2VAqhPa6xN

// * deployed with tonhub https://testnet.tonscan.org/address/EQAh3XVJheA_fL83ZfhxEfN3rUZ9-FTQS4F8WvEQPZATXu1d#transactions
// * EQAh3XVJheA_fL83ZfhxEfN3rUZ9-FTQS4F8WvEQPZATXu1d

export async function run(provider: NetworkProvider) {
  const myContract = MainContract.createFromConfig(
    {
      number: 0,
      address: address("0QA742GqD5wCFMdrxUSATw-z2_65eIdSC_uxtpgMDZxIiU9Y"),
      owner_address: address("0QA742GqD5wCFMdrxUSATw-z2_65eIdSC_uxtpgMDZxIiU9Y"),
    },
    await compile("MainContract")
  );

  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano("0.05"));

  await provider.waitForDeploy(myContract.address);
}
