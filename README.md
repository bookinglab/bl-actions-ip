# public-ip

A GitHub Action that gets the public IPv4 (and optionally IPv6) address of the Actions runner.

Drop-in replacement for [`haythem/public-ip`](https://github.com/haythem/public-ip) with multiple endpoint fallbacks for resilience.

## Usage

```yaml
- name: Get runner public IP
  id: ip
  uses: bookinglab/bl-actions-ip@v1

- name: Use the IP
  run: echo "Runner IPv4 is ${{ steps.ip.outputs.ipv4 }}"
```

## Outputs

| Output | Description |
|--------|-------------|
| `ipv4` | Public IPv4 address of the runner |
| `ipv6` | Public IPv6 address of the runner (may be empty if not available) |

## Common use case — whitelist runner IP

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Get public IP
        id: ip
        uses: bookinglab/bl-actions-ip@v1

      - name: Whitelist runner in AWS security group
        run: |
          aws ec2 authorize-security-group-ingress \
            --group-id sg-xxxx \
            --protocol tcp \
            --port 5432 \
            --cidr ${{ steps.ip.outputs.ipv4 }}/32

      # ... your deploy steps ...

      - name: Revoke runner IP
        if: always()
        run: |
          aws ec2 revoke-security-group-ingress \
            --group-id sg-xxxx \
            --protocol tcp \
            --port 5432 \
            --cidr ${{ steps.ip.outputs.ipv4 }}/32
```

## How it works

Uses multiple endpoint fallbacks for reliability — if one is unavailable or blocked, the next is tried automatically:

**IPv4:** `ipv4.icanhazip.com` → `api.ipify.org` → `api4.my-ip.io`

**IPv6:** `ipv6.icanhazip.com` → `api6.ipify.org` → `api6.my-ip.io`

Each request has a 5-second timeout. IPv6 failure is non-fatal (output will be empty string).

## Migration from `haythem/public-ip`

Replace:
```yaml
- uses: haythem/public-ip@v1.3
```

With:
```yaml
- uses: bookinglab/bl-actions-ip@v1
```

Output names (`ipv4`, `ipv6`) are identical.

## License

MIT
