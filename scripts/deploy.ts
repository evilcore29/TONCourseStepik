import { address, toNano } from "@ton/core";
import { MainContract } from "../wrappers/MainContract";
import { compile, NetworkProvider } from "@ton/blueprint";

// * Все ваши скрипты должны экспортировать функцию run, если вы хотите, чтобы они работали с Blueprint
export async function run(provider: NetworkProvider) {
  const myContract = MainContract.createFromConfig(
    {
      number: 0,
      address: address("kQDU69xgU6Mj-iNDHYsWWuNx7yRPQC_bNZNCpq5yVc7LiE7D"),
      owner_address: address("kQDU69xgU6Mj-iNDHYsWWuNx7yRPQC_bNZNCpq5yVc7LiE7D"),
    },
    await compile("MainContract")
  );

  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano("0.05"));

  await provider.waitForDeploy(myContract.address);
}
