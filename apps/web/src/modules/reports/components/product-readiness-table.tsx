import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { readinessChecks, type ReadinessProduct } from "../schemas/production-readiness";
import { ConfigurationBand, ReadinessBadge, ReadinessMark } from "./readiness-status";
import { reportNumber } from "../lib/readiness-format";

function ProductRow({ product, paper }: { product: ReadinessProduct; paper: boolean }) {
  const line = <TableRow className="readiness-data-row">
    <TableHead scope="row" className="readiness-product"><span className="font-medium">{product.productName}</span>
      <span className="readiness-secondary">{product.productCode || "No code"}</span></TableHead>
    <TableCell className="readiness-markets">{product.markets.map((market) => market.name).join(", ")}</TableCell>
    <TableCell className="readiness-number"><span className="readiness-small-label">Expected batches</span>{reportNumber(product.batches)}</TableCell>
    {!paper ? readinessChecks.map(({ key, name }) => <TableCell key={key} className="readiness-desktop-check"><ReadinessMark label={name} value={product.configuration[key]} /></TableCell>) : null}
    <TableCell className="readiness-result"><ReadinessBadge configuration={product.configuration} /></TableCell>
    {!paper ? <TableCell colSpan={11} className="readiness-check-band"><ConfigurationBand configuration={product.configuration} /></TableCell> : null}
  </TableRow>;
  return paper ? <TableBody className="readiness-paper-pair">{line}<TableRow><TableCell colSpan={4} className="readiness-check-band">
    <ConfigurationBand configuration={product.configuration} /></TableCell></TableRow></TableBody> : line;
}

export function ProductReadinessTable({ products, paper = false }: { products: readonly ReadinessProduct[]; paper?: boolean }) {
  return <Table aria-label="Product configuration readiness" className={`readiness-table readiness-products-table${paper ? " readiness-paper-table" : ""}`}>
    <TableHeader><TableRow>
      <TableHead scope="col" className="readiness-product">Product</TableHead><TableHead scope="col" className="readiness-markets">Markets</TableHead>
      <TableHead scope="col" className="readiness-number">Expected batches</TableHead>
      {!paper ? readinessChecks.map(({ key, label }) => <TableHead key={key} scope="col" className="readiness-desktop-check">{label}</TableHead>) : null}
      <TableHead scope="col" className="readiness-result">Readiness</TableHead>
    </TableRow></TableHeader>
    {paper ? products.map((product) => <ProductRow key={product.productId} product={product} paper />)
      : <TableBody>{products.map((product) => <ProductRow key={product.productId} product={product} paper={false} />)}</TableBody>}
  </Table>;
}
