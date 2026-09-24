'use client';

import type { Product } from '@bazaar/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { browserApi } from '@/lib/api';
import { rupees, toPaise } from '@/lib/money';
import { useAdminProducts, useCategories } from '@/lib/queries';

type Stock = { onHand: number; reserved: number; available: number };

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, Product>();
const columns = helper.columns([
  helper.accessor('title', { header: 'Product' }),
  helper.accessor('pricePaise', { header: 'Price', cell: (info) => rupees(info.getValue()) }),
  helper.accessor('active', { header: 'Status', cell: (info) => (info.getValue() ? 'Active' : 'Hidden') }),
  helper.display({ id: 'actions', header: 'Actions' }),
]);
const emptyProducts: Product[] = [];

export default function AdminProductsPage() {
  const products = useAdminProducts();
  const categories = useCategories();
  const queryClient = useQueryClient();
  const table = useTable({ features, columns, data: products.data?.items ?? emptyProducts });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  const create = useMutation({
    mutationFn: (input: Record<string, unknown>) => browserApi('/admin/v1/products', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: (input: { id: string; body: Record<string, unknown> }) =>
      browserApi(`/admin/v1/products/${input.id}`, { method: 'PATCH', body: JSON.stringify(input.body) }),
    onSuccess: refresh,
  });
  const form = useForm({
    defaultValues: { title: '', description: '', categorySlug: '', price: '', mrp: '', imageUrl: '', stock: '5' },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({
        title: value.title,
        description: value.description,
        categorySlug: value.categorySlug || categories.data?.[0]?.slug,
        pricePaise: toPaise(value.price),
        mrpPaise: toPaise(value.mrp),
        imageUrl: value.imageUrl,
        stock: Number(value.stock),
        active: true,
      });
      form.reset();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Products</h1>
      {create.isError || update.isError || products.isError ? (
        <p className="mt-3 text-danger">
          {(create.error ?? update.error ?? products.error) instanceof Error
            ? ((create.error ?? update.error ?? products.error) as Error).message
            : 'Could not update the catalog'}
        </p>
      ) : null}
      <form
        className="mt-4 grid gap-2 rounded-lg bg-white p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="title">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Title" className="rounded border border-line px-3 py-2" />
          )}
        </form.Field>
        <form.Field name="categorySlug">
          {(field) => (
            <select value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className="rounded border border-line px-3 py-2">
              <option value="">Category</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <textarea
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Description"
              className="rounded border border-line px-3 py-2 md:col-span-2"
            />
          )}
        </form.Field>
        <form.Field name="price">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Price in rupees" className="rounded border border-line px-3 py-2" />
          )}
        </form.Field>
        <form.Field name="mrp">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="MRP in rupees" className="rounded border border-line px-3 py-2" />
          )}
        </form.Field>
        <form.Field name="imageUrl">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Image URL" className="rounded border border-line px-3 py-2" />
          )}
        </form.Field>
        <form.Field name="stock">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Stock" className="rounded border border-line px-3 py-2" />
          )}
        </form.Field>
        <button className="rounded-lg bg-primary px-4 py-2 font-semibold text-onPrimary md:col-span-2">Create product</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-lg bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="p-3">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line odd:bg-sand/60">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="p-3 align-top">
                    {cell.column.id === 'actions' ? (
                      <ProductActions
                        product={row.original}
                        onToggle={() => update.mutate({ id: row.original.id, body: { active: !row.original.active } })}
                        onPrice={(pricePaise, mrpPaise) => update.mutate({ id: row.original.id, body: { pricePaise, mrpPaise } })}
                      />
                    ) : (
                      <table.FlexRender cell={cell} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductActions({
  product,
  onToggle,
  onPrice,
}: {
  product: Product;
  onToggle: () => void;
  onPrice: (pricePaise: number, mrpPaise: number) => void;
}) {
  const queryClient = useQueryClient();
  const stock = useMutation({
    mutationFn: (onHand: number) =>
      browserApi<Stock>(`/admin/v1/inventory/${product.id}`, { method: 'PUT', body: JSON.stringify({ onHand }) }),
    onSuccess: (next) => queryClient.setQueryData(['admin', 'stock', product.id], next),
  });
  const price = useForm({
    defaultValues: { price: (product.pricePaise / 100).toString(), mrp: (product.mrpPaise / 100).toString(), onHand: '' },
    onSubmit: async ({ value }) => {
      onPrice(toPaise(value.price), toPaise(value.mrp));
    },
  });

  return (
    <div className="space-y-2">
      <button className="text-info" onClick={onToggle}>
        {product.active ? 'Hide' : 'Show'}
      </button>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void price.handleSubmit();
        }}
      >
        <price.Field name="price">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className="w-24 rounded border border-line px-2 py-1" />
          )}
        </price.Field>
        <price.Field name="mrp">
          {(field) => (
            <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} className="w-24 rounded border border-line px-2 py-1" />
          )}
        </price.Field>
        <button className="rounded bg-ink px-3 py-1 text-white">Update price</button>
      </form>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const onHand = Number(new FormData(event.currentTarget).get('onHand'));
          stock.mutate(onHand);
        }}
      >
        <input name="onHand" type="number" min={0} placeholder="On hand" className="w-24 rounded border border-line px-2 py-1" />
        <button className="rounded bg-ink px-3 py-1 text-white">Set stock</button>
        {stock.data ? (
          <span className="text-muted">
            on hand {stock.data.onHand}, reserved {stock.data.reserved}
          </span>
        ) : null}
      </form>
    </div>
  );
}
