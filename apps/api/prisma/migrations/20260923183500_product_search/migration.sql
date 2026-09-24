CREATE INDEX products_search_idx
  ON catalog.products
  USING gin (to_tsvector('english', title || ' ' || description));
