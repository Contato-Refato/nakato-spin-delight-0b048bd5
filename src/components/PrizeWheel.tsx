import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// ==========================================
// 🎯 CONFIGURAÇÃO DOS PRÊMIOS E PROBABILIDADES
// ==========================================
// Edite aqui para alterar os prêmios e suas chances
const PRIZES = [
  { id: 1, name: "Combinado de Salmão", probability: 1, color: "#F26A21" },
  { id: 2, name: "30% OFF no pedido", probability: 10.44, color: "#0F4C2E" },
  { id: 3, name: "Refrigerante", probability: 10.44, color: "#F26A21" },
  { id: 4, name: "Hot Banana (10 un.)", probability: 10.44, color: "#0F4C2E" },
  { id: 5, name: "Hot Roll (10 un.)", probability: 10.44, color: "#F26A21" },
  { id: 6, name: "Yakissoba Clássico", probability: 5, color: "#0F4C2E" },
  { id: 7, name: "Petit Gateau", probability: 10.44, color: "#F26A21" },
  { id: 8, name: "R$ 10 OFF", probability: 10.44, color: "#0F4C2E" },
  { id: 9, name: "15% OFF no pedido", probability: 10.44, color: "#F26A21" },
  { id: 10, name: "R$ 5 OFF", probability: 10.44, color: "#0F4C2E" },
  { id: 11, name: "10% OFF no pedido", probability: 10.44, color: "#F26A21" },
];

// ==========================================
// 🎨 CONFIGURAÇÕES VISUAIS
// ==========================================
const WHEEL_CONFIG = {
  spinDuration: 5000, // Duração do giro em milissegundos
  minSpins: 5, // Número mínimo de voltas completas
  enableSound: false, // Ativar sons (true/false)
  wheelSize: 400, // Tamanho da roleta em pixels
  borderWidth: 15, // Largura da borda externa
  centerCircleSize: 60, // Tamanho do círculo central
};

export const PrizeWheel = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Desenhar a roleta no canvas
  const drawWheel = (currentRotation: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = WHEEL_CONFIG.wheelSize / 2;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Salvar estado
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((currentRotation * Math.PI) / 180);

    // Desenhar fatias
    const anglePerSlice = (2 * Math.PI) / PRIZES.length;
    PRIZES.forEach((prize, index) => {
      const startAngle = index * anglePerSlice - Math.PI / 2;
      const endAngle = startAngle + anglePerSlice;

      // Fatia
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      // Borda branca entre fatias
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Texto do prêmio - centralizado na fatia
      ctx.save();
      ctx.rotate(startAngle + anglePerSlice / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 15px 'Inter', sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      // Quebrar texto em múltiplas linhas se necessário
      const words = prize.name.split(" ");
      const maxWidth = radius * 0.55;
      let line = "";
      const lines: string[] = [];

      words.forEach((word) => {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      });
      lines.push(line.trim());

      // Calcular posição vertical centralizada
      const lineHeight = 20;
      const totalHeight = lines.length * lineHeight;
      const textRadius = radius * 0.7; // Distância do centro
      const startY = -(totalHeight / 2) + lineHeight / 2;

      // Desenhar cada linha centralizada
      lines.forEach((textLine, i) => {
        ctx.fillText(textLine, textRadius, startY + i * lineHeight);
      });

      ctx.restore();
    });

    ctx.restore();

    // Borda externa decorativa
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#0F4C2E";
    ctx.lineWidth = WHEEL_CONFIG.borderWidth;
    ctx.stroke();

    // Círculo central decorativo
    ctx.beginPath();
    ctx.arc(centerX, centerY, WHEEL_CONFIG.centerCircleSize, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#F26A21";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Logo texto no centro
    ctx.fillStyle = "#0F4C2E";
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NAKATO", centerX, centerY);
  };

  // Calcular prêmio baseado no ângulo final
  const calculatePrize = (finalRotation: number): string => {
    const normalizedRotation = finalRotation % 360;
    const anglePerSlice = 360 / PRIZES.length;
    // A seta está no topo (0°). Ajustar para encontrar qual fatia está no topo
    const adjustedRotation = (normalizedRotation + anglePerSlice / 2) % 360;
    const prizeIndex = Math.floor(adjustedRotation / anglePerSlice) % PRIZES.length;
    return PRIZES[prizeIndex].name;
  };

  // Selecionar prêmio baseado na probabilidade
  const selectPrizeByProbability = (): number => {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (let i = 0; i < PRIZES.length; i++) {
      cumulativeProbability += PRIZES[i].probability;
      if (random <= cumulativeProbability) {
        return i;
      }
    }

    return 0; // Fallback
  };

  // Função de girar a roleta
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowModal(false);

    const targetPrizeIndex = selectPrizeByProbability();
    const anglePerSlice = 360 / PRIZES.length;
    const targetAngle = targetPrizeIndex * anglePerSlice;

    // Adicionar múltiplas voltas completas + ângulo alvo
    const extraSpins = WHEEL_CONFIG.minSpins * 360;
    const finalRotation = extraSpins + (360 - targetAngle) + anglePerSlice / 2;

    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / WHEEL_CONFIG.spinDuration, 1);

      // Easing function: easeOutCubic para desaceleração suave
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + finalRotation * easeOut;
      setRotation(currentRotation);
      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const prize = calculatePrize(currentRotation);
        setWonPrize(prize);
        setShowModal(true);
      }
    };

    requestAnimationFrame(animate);
  };

  // Desenhar roleta inicial
  useEffect(() => {
    drawWheel(rotation);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-hero p-4">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          Roleta de Prêmios
        </h1>
        <p className="text-lg md:text-xl text-white/90 font-medium">
          Restaurante Nakato
        </p>
        <p className="text-white/80 mt-2">Gire e ganhe prêmios incríveis!</p>
      </div>

      {/* Wheel Container */}
      <div className="relative mb-8">
        {/* Indicador (Seta no topo) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-primary drop-shadow-lg"></div>
        </div>

        {/* Canvas da Roleta */}
        <div className="relative shadow-wheel rounded-full bg-white p-4">
          <canvas
            ref={canvasRef}
            width={WHEEL_CONFIG.wheelSize + 40}
            height={WHEEL_CONFIG.wheelSize + 40}
            className="max-w-full h-auto"
          />
        </div>
      </div>

      {/* Botão Girar */}
      <Button
        onClick={spinWheel}
        disabled={isSpinning}
        className="bg-primary hover:bg-primary/90 text-white font-bold text-xl px-12 py-6 rounded-full shadow-button transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isSpinning ? "Girando..." : "GIRAR ROLETA"}
      </Button>

      {/* Modal de Resultado */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white border-4 border-primary">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-secondary mb-2">
              🎉 Parabéns! 🎉
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="my-6">
                <p className="text-lg text-foreground mb-4">Você ganhou:</p>
                <div className="bg-gradient-primary text-white p-6 rounded-xl shadow-lg">
                  <p className="text-2xl font-bold">{wonPrize}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Aproveite seu prêmio no Restaurante Nakato!
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => setShowModal(false)}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 py-3 rounded-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center mt-8 text-white/70 text-sm">
        <p>© 2024 Nakato - Restaurante Japonês</p>
      </div>
    </div>
  );
};
