# Blood Oath

---

### A set of tools for contract testing.

<p align="center">
  <img alt="Logo" title="Logo" width="512px" src="./img/logo.png" />
</p>

## Exported methods

### saveContracts

Saves a collection of **Contracts** to disk

```typescript
saveContracts(contracts: Contract[], filename: string = "./api.contracts.dat"): Promise<boolean>
```

### verifyContract

Checks that a **Contract** still returns the same result

```typescript
verifyContract(contract: Contract): Promise<boolean>
```

### verifyContracts

Checks that a collection of **Contracts** still returns same results

```typescript
verifyContracts(contracts: Contract[]): Promise<boolean[]>
```

### signContract

Takes an **Unsigned Contract**, makes a request, and adds a snapshot of the response to "sign" the **Contract**

```typescript
signContract(contract: UnsignedContract): Promise<Contract>
```

### snapshotSpec

Ingests the OpenAPI Spec file located at the path in `specFile`, snapshots requests to every endpoint, and saves the resulting **Contracts** to disk

```typescript
snapshotSpec(specFile: string, contractFile?: string): Promise<Contract[]>
```

### Contract

```typescript
interface Contract {
  meta: ContractMeta;
  request: ContractRequest;
  response: ContractResponse;
}
```
