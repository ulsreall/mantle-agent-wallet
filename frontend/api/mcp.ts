export default function handler(req: any, res: any) {
  // Support both GET and POST for 8004scan compatibility
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'MantleAgent',
      agent_id: 98,
      chain: 'mantle',
      version: '1.0.0',
      capabilities: ['wallet', 'defi', 'strategies'],
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === 'POST') {
    // Handle MCP protocol messages
    const { method } = req.body || {};

    switch (method) {
      case 'initialize':
        return res.status(200).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'MantleAgent',
              version: '1.0.0',
            },
          },
        });

      case 'tools/list':
        return res.status(200).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          result: {
            tools: [
              {
                name: 'get_balance',
                description: 'Get wallet balance on Mantle Network',
                inputSchema: {
                  type: 'object',
                  properties: {
                    address: { type: 'string', description: 'Wallet address' },
                  },
                },
              },
              {
                name: 'get_strategies',
                description: 'List available DeFi strategies',
                inputSchema: { type: 'object', properties: {} },
              },
              {
                name: 'get_agent_info',
                description: 'Get agent metadata and ERC-8004 identity',
                inputSchema: { type: 'object', properties: {} },
              },
            ],
          },
        });

      default:
        return res.status(200).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          error: { code: -32601, message: 'Method not found' },
        });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
