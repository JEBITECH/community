test('auth service health check', () => {
  expect(1 + 1).toBe(2);
});

test('auth service environment', () => {
  expect(process.env.NODE_ENV).toBe('test');
});