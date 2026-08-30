import { Router, Request, Response } from 'express';
import { calculateSubnet, calculateVLSM, analyzeIP } from '../../../src/utils/subnetCalculator';
import { simulatePacketTrace } from '../../../src/utils/networkSimulator';
import { runDiagnostics } from '../../../src/utils/diagnosticEngine';
import { evaluateTopologyDesign } from '../../../src/utils/designScorer';
import { executeSimulatedCommand } from '../../../src/utils/terminalSimulator';
import { PROTOCOLS_DATA } from '../../../src/data/protocolsData';
import { LABS_DATA } from '../../../src/data/labsData';
import { QUIZZES_DATA } from '../../../src/data/quizzesData';
import { CHALLENGES_DATA } from '../../../src/data/challengesData';
import { PRESET_TOPOLOGIES } from '../../../src/data/topologiesData';
import { ACHIEVEMENTS_DATA } from '../../../src/data/achievementsData';

const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      platform: 'NET-LAB Interactive Networking Platform',
      creator: 'Sandesh Bajgai'
    }
  });
});

// --- TOOLS / CALCULATORS ---
apiRouter.post('/tools/subnet', (req: Request, res: Response) => {
  try {
    const { ip, cidr } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'IP address is required.' } });
    }
    const result = calculateSubnet(ip, cidr !== undefined ? cidr : 24);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'CALCULATION_ERROR', message: err.message } });
  }
});

apiRouter.post('/tools/vlsm', (req: Request, res: Response) => {
  try {
    const { baseNetwork, baseCidr, subnets } = req.body;
    if (!baseNetwork || !subnets || !Array.isArray(subnets)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Base network and subnets array required.' } });
    }
    const results = calculateVLSM(baseNetwork, baseCidr || 24, subnets);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'VLSM_ERROR', message: err.message } });
  }
});

apiRouter.get('/tools/ip-analyzer', (req: Request, res: Response) => {
  try {
    const ip = req.query.ip as string;
    if (!ip) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'IP query parameter required.' } });
    }
    const analysis = analyzeIP(ip);
    res.json({ success: true, data: analysis });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'ANALYSIS_ERROR', message: err.message } });
  }
});

// --- PACKET SIMULATION ---
apiRouter.post('/simulation/trace', (req: Request, res: Response) => {
  try {
    const { topology, source, destination, protocol, port } = req.body;
    if (!topology || !source || !destination) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Topology, source, and destination are required.' } });
    }
    const result = simulatePacketTrace(topology, source, destination, protocol || 'ICMP', port || 80);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SIMULATION_ERROR', message: err.message } });
  }
});

// --- DIAGNOSTICS ("Why did this packet fail?") ---
apiRouter.post('/diagnostics/evaluate', (req: Request, res: Response) => {
  try {
    const { topology, sourceDeviceId, targetDeviceId } = req.body;
    if (!topology) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Topology object required.' } });
    }
    const report = runDiagnostics(topology, sourceDeviceId, targetDeviceId);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'DIAGNOSTIC_ERROR', message: err.message } });
  }
});

// --- DESIGN SCORER ---
apiRouter.post('/topologies/evaluate-score', (req: Request, res: Response) => {
  try {
    const { topology } = req.body;
    if (!topology) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Topology object required.' } });
    }
    const evaluation = evaluateTopologyDesign(topology);
    res.json({ success: true, data: evaluation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'EVALUATION_ERROR', message: err.message } });
  }
});

// --- TERMINAL SIMULATOR ---
apiRouter.post('/terminal/execute', (req: Request, res: Response) => {
  try {
    const { command, selectedDeviceId, topology } = req.body;
    if (!command || !topology) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Command and topology required.' } });
    }
    const output = executeSimulatedCommand(command, selectedDeviceId, topology);
    res.json({ success: true, data: output });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'TERMINAL_ERROR', message: err.message } });
  }
});

// --- DATA COLLECTIONS ---
apiRouter.get('/protocols', (req: Request, res: Response) => {
  res.json({ success: true, data: PROTOCOLS_DATA });
});

apiRouter.get('/protocols/:id', (req: Request, res: Response) => {
  const protocol = PROTOCOLS_DATA.find(p => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!protocol) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Protocol not found.' } });
  }
  res.json({ success: true, data: protocol });
});

apiRouter.get('/labs', (req: Request, res: Response) => {
  res.json({ success: true, data: LABS_DATA });
});

apiRouter.get('/labs/:id', (req: Request, res: Response) => {
  const lab = LABS_DATA.find(l => l.id === req.params.id || l.labNumber === parseInt(req.params.id, 10));
  if (!lab) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lab not found.' } });
  }
  res.json({ success: true, data: lab });
});

apiRouter.get('/quizzes', (req: Request, res: Response) => {
  const topic = req.query.topic as string;
  const filtered = topic ? QUIZZES_DATA.filter(q => q.topic.toLowerCase() === topic.toLowerCase()) : QUIZZES_DATA;
  res.json({ success: true, data: filtered });
});

apiRouter.get('/challenges', (req: Request, res: Response) => {
  res.json({ success: true, data: CHALLENGES_DATA });
});

apiRouter.get('/topologies/presets', (req: Request, res: Response) => {
  res.json({ success: true, data: PRESET_TOPOLOGIES });
});

apiRouter.get('/achievements', (req: Request, res: Response) => {
  res.json({ success: true, data: ACHIEVEMENTS_DATA });
});

export default apiRouter;
