/**
 * Minimal deterministic VM executing a JSON DSL with gas limits.
 * Contract state is a flat key/value object (string keys -> JSON values).
 *
 * Supported ops:
 * - set { key, value }
 * - get { key } (returns value into ctx.last)
 * - inc { key, by }
 * - ifEq { key, value, then: [ops], else: [ops] }
 * - emit { event, data }
 *
 * Gas model: each op costs 1, inc costs 2, ifEq costs 1 + children.
 */
class SimpleVM {
    constructor(maxGas = 1000) {
        this.maxGas = maxGas;
    }

    run(code, state, ctx = {}) {
        const events = [];
        let gas = 0;
        const emit = (event, data) => events.push({ event, data, ts: Date.now() });

        const ops = Array.isArray(code) ? code : (code && code.ops) || [];

        const exec = (op) => {
            if (gas >= this.maxGas) throw new Error('Out of gas');
            const t = op.op || op.type;
            switch (t) {
                case 'set':
                    gas += 1;
                    state[op.key] = op.value;
                    break;
                case 'get':
                    gas += 1;
                    ctx.last = state[op.key];
                    break;
                case 'inc':
                    gas += 2;
                    state[op.key] = (Number(state[op.key]) || 0) + (Number(op.by) || 1);
                    break;
                case 'ifEq':
                    gas += 1;
                    if (state[op.key] === op.value) {
                        (op.then || []).forEach(exec);
                    } else {
                        (op.else || []).forEach(exec);
                    }
                    break;
                case 'emit':
                    gas += 1;
                    emit(op.event, op.data);
                    break;
                default:
                    throw new Error(`Unsupported op: ${t}`);
            }
        };

        ops.forEach(exec);
        return { state, gasUsed: gas, events };
    }
}

module.exports = SimpleVM;

