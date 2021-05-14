import async from "../lib/async-error";
import domainEvents from "./domain-events";

/**
 * Steps through the sequence of port calls
 * in LIFO order executing their undo functions.
 * @param {import('.').Model} model
 * @returns {function():Promise<void>}
 */
export default async function compensate(model) {
  try {
    const saved = await model.update({ compensate: true });
    const portFlow = model.getPortFlow();
    const ports = model.getPorts();

    await saved.emit(domainEvents.undoStarted(saved), "undo starting");

    setTimeout(reverseTransactions, 30000, saved);

    async function reverseTransactions(model) {
      const undoResult = await portFlow.reduceRight(
        async (_prev, port, index, arr) => {
          if (ports[port].undo) {
            console.log("calling undo on port: ", port);
            const result = await async(ports[port].undo(model));

            if (result.ok) {
              return arr.splice(0, index);
            }
            throw new Error("undo failed on port: ", port, result.error);
          }
          return Promise.resolve(arr.splice(0, index));
        }
      );

      if (undoResult.length > 0) {
        const lastPort = portFlow[undoResult.length - 1];
        const msg = "undo incomplete, last port compensated " + lastPort;

        const recordPort = await model.update({
          lastPort,
          compensateResult: "INCOMPLETE",
        });

        await recordPort.emit(domainEvents.undoFailed(model), msg);
        console.error(msg, saved);
        return;
      }
      const compensateResult = "COMPLETE";
      await model.emit(domainEvents.undoWorked(model), compensateResult);
      await model.update({ compensateResult });
    }
  } catch (error) {
    console.error(error);
    await model.emit(domainEvents.undoFailed(model), error.message);
  }
}
