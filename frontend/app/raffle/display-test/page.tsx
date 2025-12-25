'use client';

import WinnersList from '@/components/raffle/WinnersList';
import SaveConfirmModal from '@/components/raffle/SaveConfirmModal';
import SpinConfirmModal from '@/components/raffle/SpinConfirmModal';
import RaffleGridDisplay from '@/components/raffle/RaffleGridDisplay';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { raffleApi, Prize } from '@/lib/api/raffle';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRole } from '@/lib/hooks/useRole';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

/**
 * หน้าประกาศรางวัล (Public Page) - TEST VERSION
 * 
 * หน้าที่:
 * - แสดงผลการจับสลากแบบเรียลไทม์
 * - ใช้ WebSocket เพื่ออัปเดตผลแบบทันที
 * - แสดงผลแบบ Fullscreen สำหรับ Projector
 * - ไม่ต้อง Login
 * 
 * Features:
 * - แสดงรายชื่อผู้ชนะรางวัลแต่ละรอบ
 * - แสดงผลแบบ Animation เมื่อมีการจับสลากใหม่
 * - รองรับ Dark Mode สำหรับ Projector
 * 
 * NOTE: This is a test version for development. Do not modify the original display page.
 */
export default function RaffleDisplayTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();
  const { canSpinRaffle } = useRole();
  
  // State management
  const [raffleEventId, setRaffleEventId] = useState<number | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(1);
  const [currentWinners, setCurrentWinners] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCards, setSpinningCards] = useState<boolean[]>([]);
  const [revealedWinners, setRevealedWinners] = useState<any[]>([]); // เก็บ winners ที่จะแสดงผลหลังจาก animation เสร็จ
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string>('');
  const [selectedRuleSnapshot, setSelectedRuleSnapshot] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [selectedWinners, setSelectedWinners] = useState<any[]>([]); // เก็บ winners ที่ได้จาก API ตอน spin
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [spinClientId, setSpinClientId] = useState<string | null>(null); // เก็บ client ID ของเครื่องที่กด spin
  const [remoteIsSpinning, setRemoteIsSpinning] = useState(false); // Track remote spinning state from WebSocket
  
  // Refs สำหรับเก็บ metadata สำหรับ save
  const selectedSeedRef = useRef<string>('');
  const selectedRuleSnapshotRef = useRef<any>(null);
  const selectedResultRef = useRef<any>(null);
  
  // Audio ref for spin sound
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Generate unique client ID for this browser tab
  const getClientId = (): string => {
    if (typeof window !== 'undefined') {
      // Try to get from sessionStorage first
      let clientId = sessionStorage.getItem('raffle_client_id');
      if (!clientId) {
        // Generate new client ID
        clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('raffle_client_id', clientId);
      }
      return clientId;
    }
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  const clientIdRef = useRef<string>(getClientId());
  
  // Initialize audio
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      spinSoundRef.current = new Audio('/audio/wheel.mp3');
      spinSoundRef.current.preload = 'auto';
    }
    
    // Cleanup on unmount
    return () => {
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
        spinSoundRef.current = null;
      }
    };
  }, []);

  // Check authentication
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/dashboard/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Extract raffle_event from URL
  useEffect(() => {
    const raffleEventParam = searchParams.get('raffle_event');
    if (raffleEventParam) {
      const eventId = parseInt(raffleEventParam, 10);
      if (!isNaN(eventId)) {
        setRaffleEventId(eventId);
      } else {
        setError('Invalid raffle_event parameter');
      }
    } else {
      setError('raffle_event parameter is required');
    }
  }, [searchParams]);

  // State for event ID from raffle event
  const [eventId, setEventId] = useState<number | undefined>(undefined);

  const loadPrizes = async () => {
    if (!raffleEventId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await raffleApi.listPrizesPublic(raffleEventId);
      setPrizes(data);
    } catch (err: any) {
      console.error('Error loading prizes:', err);
      setError(err.response?.data?.error || 'Failed to load prizes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch prizes when raffleEventId is available
  useEffect(() => {
    if (raffleEventId) {
      loadRaffleEvent();
      loadPrizes();
    }
  }, [raffleEventId]);

  // Use refs to avoid stale closures in WebSocket handler
  const prizesRef = useRef(prizes);
  const selectedPrizeRef = useRef(selectedPrize);
  const currentWinnersRef = useRef(currentWinners);
  const revealedWinnersRef = useRef(revealedWinners);
  const selectedWinnersRef = useRef(selectedWinners);
  const displayCountRef = useRef(displayCount);

  useEffect(() => {
    prizesRef.current = prizes;
  }, [prizes]);

  useEffect(() => {
    selectedPrizeRef.current = selectedPrize;
  }, [selectedPrize]);

  useEffect(() => {
    currentWinnersRef.current = currentWinners;
  }, [currentWinners]);

  useEffect(() => {
    revealedWinnersRef.current = revealedWinners;
  }, [revealedWinners]);

  useEffect(() => {
    selectedWinnersRef.current = selectedWinners;
  }, [selectedWinners]);

  useEffect(() => {
    displayCountRef.current = displayCount;
  }, [displayCount]);

  // Direct spin handler (without modal confirmation) for WebSocket commands
  const handleSpinDirect = useCallback(async (prizeToUse?: Prize, countToUse?: number) => {
    const prize = prizeToUse || selectedPrizeRef.current;
    const count = countToUse !== undefined ? countToUse : displayCountRef.current;

    if (!prize) {
      console.error('No prize selected for spin');
      setError('กรุณาเลือกรางวัลก่อน');
      return;
    }

    console.log('handleSpinDirect called with prize:', prize.id, 'count:', count);

    try {
      setLoading(true);
      setError(null);
      setIsSpinning(true);

      // Use displayCount as quantity (limit to available prizes)
      const availableQuantity = prize.quantity - prize.selected_count;
      const quantity = Math.min(count, availableQuantity);

      console.log('Calling selectWinners API with prize:', prize.id, 'quantity:', quantity);

      // Call API to select winners (does not save)
      const result = await raffleApi.selectWinners(prize.id, quantity);
      
      if (result.success && result.winners) {
        console.log('Select winners success, winners count:', result.winners.length);
        // เวลาหมุน 6.5 วินาที (6500ms) ให้จบทันกับเพลง
        const spinDuration = 6500;
        
        // ตั้งค่า client ID ของเครื่องที่กด spin
        setSpinClientId(clientIdRef.current);
        
        // เล่นเสียง wheel.mp3
        if (spinSoundRef.current) {
          spinSoundRef.current.currentTime = 0; // Reset to start
          spinSoundRef.current.play().catch((err: any) => {
            console.error('Error playing spin sound:', err);
          });
        }
        
        // Store metadata for saving later (แต่ยังไม่แสดงผลลัพธ์)
        const seed = result.seed || '';
        const ruleSnapshot = result.rule_snapshot || {};
        const resultData = result.result || {};
        setSelectedSeed(seed);
        setSelectedRuleSnapshot(ruleSnapshot);
        setSelectedResult(resultData);
        selectedSeedRef.current = seed;
        selectedRuleSnapshotRef.current = ruleSnapshot;
        selectedResultRef.current = resultData;
        setSelectedWinners(result.winners || []); // เก็บ winners ที่ได้จาก API
        
        // อย่าแสดงผลลัพธ์ทันที - สร้าง placeholder winners สำหรับแสดง card (แต่ยังไม่แสดงชื่อจริง)
        const placeholderWinners = result.winners.map(() => ({ name: undefined }));
        setCurrentWinners(placeholderWinners); // ใช้ placeholder เพื่อแสดง card
        setRevealedWinners([]); // ล้าง revealed winners
        
        // Staggered animation - แต่ละ card เริ่มหมุนทีละตัว (delay 100ms ต่อ card)
        const staggerDelay = 100; // ระยะห่างระหว่างแต่ละ card (ms)
        
        // เริ่ม spinning animation แบบ staggered
        Array.from({ length: result.winners.length }, (_, index) => {
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * staggerDelay);
        });
        
        // Stop spinning after calculated duration for each card (รวม delay)
        Array.from({ length: result.winners.length }, (_, index) => {
          const cardStartDelay = index * staggerDelay;
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = false;
              return newState;
            });
          }, cardStartDelay + spinDuration);
        });

        // เปิดเผยผลลัพธ์หลังจาก animation เสร็จทั้งหมด
        const lastCardDelay = (result.winners.length - 1) * staggerDelay;
        setTimeout(() => {
          // แสดงผลลัพธ์หลังจาก animation เสร็จ
          setCurrentWinners(result.winners);
          setRevealedWinners(result.winners);
          // อย่า reset isSpinning ที่นี่ - ให้ disable ปุ่ม Spin จนกว่าจะบันทึก
          // setIsSpinning(false); จะ reset เมื่อบันทึกเสร็จใน handleSaveConfirm
        }, lastCardDelay + spinDuration + 500);
      } else {
        setError(result.error || 'Failed to select winners');
        setIsSpinning(false);
      }
    } catch (err: any) {
      console.error('Error selecting winners:', err);
      setError(err.response?.data?.error || 'Failed to select winners');
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Store handleSpinDirect in ref for WebSocket handler
  const handleSpinDirectRef = useRef(handleSpinDirect);
  useEffect(() => {
    handleSpinDirectRef.current = handleSpinDirect;
  }, [handleSpinDirect]);

  // Store handleSaveConfirm in ref for WebSocket handler (will be set after handleSaveConfirm is defined)
  const handleSaveConfirmRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // WebSocket connection for receiving control actions
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const wsUrl = raffleEventId 
    ? `${API_URL.replace('/api', '')}/ws/raffle/${raffleEventId}/`
    : '';

  const { isConnected, lastMessage } = useWebSocket({
    url: wsUrl,
    onOpen: () => {
      console.log('✅ WebSocket connected to:', wsUrl);
    },
    onClose: () => {
      console.log('❌ WebSocket disconnected');
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error);
    },
    onMessage: (message) => {
      console.log('WebSocket message received:', message);
      if (message.type === 'control_action') {
        const { action, data } = message;
        
        switch (action) {
          case 'spin':
            if (data.prize_id && data.display_count) {
              console.log('Received spin command:', data);
              // Find and select prize
              const prize = prizesRef.current.find(p => p.id === data.prize_id);
              if (prize) {
                console.log('Found prize:', prize);
                setSelectedPrize(prize);
                setDisplayCount(data.display_count);
                // Trigger spin directly without modal confirmation
                // Use longer timeout to ensure state is updated
                setTimeout(() => {
                  console.log('Triggering handleSpinDirect with prize:', prize.id, 'count:', data.display_count);
                  handleSpinDirectRef.current(prize, data.display_count);
                }, 500);
              } else {
                console.error('Prize not found:', data.prize_id, 'Available prizes:', prizesRef.current);
                // Try to reload prizes and retry
                if (raffleEventId) {
                  loadPrizes().then(() => {
                    setTimeout(() => {
                      const retryPrize = prizesRef.current.find(p => p.id === data.prize_id);
                      if (retryPrize) {
                        setSelectedPrize(retryPrize);
                        setDisplayCount(data.display_count);
                        setTimeout(() => {
                          handleSpinDirectRef.current(retryPrize, data.display_count);
                        }, 500);
                      }
                    }, 1000);
                  });
                }
              }
            }
            break;
          
          case 'save':
            // ตรวจสอบว่ามี winners ที่จะบันทึกได้หรือไม่ (revealedWinners หรือ selectedWinners)
            const hasRevealedWinners = revealedWinnersRef.current.length > 0;
            const hasSelectedWinners = selectedWinnersRef.current.length > 0;
            const hasCurrentWinners = currentWinnersRef.current.length > 0;
            
            console.log('Received save command', {
              hasRevealedWinners,
              hasSelectedWinners,
              hasCurrentWinners,
              revealedWinners: revealedWinnersRef.current,
              selectedWinners: selectedWinnersRef.current,
              currentWinners: currentWinnersRef.current,
            });
            
            if (hasRevealedWinners || hasSelectedWinners || hasCurrentWinners) {
              console.log('Calling handleSaveConfirm from WebSocket');
              // เรียก handleSaveConfirm โดยตรง (ไม่ผ่าน modal) เมื่อเป็น WebSocket command
              // ใช้ setTimeout เพื่อให้แน่ใจว่า state ได้ update แล้ว
              setTimeout(() => {
                if (handleSaveConfirmRef.current) {
                  console.log('Executing handleSaveConfirm from WebSocket');
                  handleSaveConfirmRef.current().catch(err => {
                    console.error('Error executing handleSaveConfirm:', err);
                  });
                } else {
                  console.error('handleSaveConfirmRef.current is undefined');
                }
              }, 100);
            } else {
              console.warn('No winners to save', {
                hasRevealedWinners,
                hasSelectedWinners,
                hasCurrentWinners,
                revealedWinners: revealedWinnersRef.current,
                selectedWinners: selectedWinnersRef.current,
                currentWinners: currentWinnersRef.current,
              });
            }
            break;
          
          case 'select_prize':
            if (data.prize_id) {
              console.log('Received select_prize command:', data.prize_id);
              const prize = prizesRef.current.find(p => p.id === data.prize_id);
              if (prize) {
                handlePrizeChange(prize.id.toString());
              }
            }
            break;
          
          case 'set_display_count':
            if (data.display_count) {
              console.log('Received set_display_count command:', data.display_count);
              handleDisplayCountChange(data.display_count.toString());
            }
            break;
          
          case 'play_sound':
            if (data.sound_file && spinSoundRef.current) {
              console.log('Received play_sound command:', data.sound_file);
              spinSoundRef.current.src = `/audio/${data.sound_file}`;
              spinSoundRef.current.currentTime = 0;
              spinSoundRef.current.play().catch((err: any) => {
                console.error('Error playing sound:', err);
              });
            }
            break;
          
          case 'spin_state':
            if (data.isSpinning !== undefined) {
              console.log('Received spin_state command:', data.isSpinning);
              setRemoteIsSpinning(data.isSpinning);
            }
            break;
        }
      }
    },
  });

  const loadRaffleEvent = async () => {
    if (!raffleEventId) return;
    
    try {
      const raffleEvent = await raffleApi.getEvent(raffleEventId);
      // RaffleEvent has 'event' field which is the event ID (number)
      if (raffleEvent.event) {
        setEventId(raffleEvent.event);
      }
    } catch (err: any) {
      console.error('Error loading raffle event:', err);
    }
  };

  // Update spinning cards when currentWinners changes - only reset if not currently spinning
  useEffect(() => {
    if (currentWinners.length > 0 && !isSpinning) {
      // Reset spinning cards only when not spinning and winners changed
      setSpinningCards(prev => {
        // ถ้า length เปลี่ยนให้ reset
        if (prev.length !== currentWinners.length) {
          return Array(currentWinners.length).fill(false);
        }
        return prev;
      });
    } else if (currentWinners.length === 0) {
      // Reset เมื่อไม่มี winners
      setSpinningCards([]);
    }
  }, [currentWinners.length, isSpinning]);

  // Get available prizes (not completed)
  const availablePrizes = prizes.filter(p => p.selected_count < p.quantity);

  // Grid layout configuration - แยก config เพื่อแก้ไขง่าย
  // ปรับ padding และ font size ให้พอดีกับจอเดียว

  const handleSpinClick = () => {
    if (!selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      return;
    }
    // ตรวจสอบว่ามี winners ที่ยังไม่ได้บันทึกหรือไม่
    const hasUnsavedWinners = revealedWinners.length > 0 || 
                               (currentWinners.length > 0 && currentWinners.some(w => w && w.id));
    if (hasUnsavedWinners) {
      setError('กรุณาบันทึกรางวัลก่อนทำการจับสลากครั้งใหม่');
      return;
    }
    setIsSpinModalOpen(true);
  };

  const handleSpin = async () => {
    if (!selectedPrize) {
      setError('กรุณาเลือกรางวัลก่อน');
      setIsSpinModalOpen(false);
      return;
    }

    setIsSpinModalOpen(false);
    // Set isSpinning = true หลังจาก confirm แล้ว
    setIsSpinning(true);

    try {
      setLoading(true);
      setError(null);

      // Use displayCount as quantity (limit to available prizes)
      const availableQuantity = selectedPrize.quantity - selectedPrize.selected_count;
      const quantity = Math.min(displayCount, availableQuantity);

      // Call API to select winners (does not save)
      const result = await raffleApi.selectWinners(selectedPrize.id, quantity);
      
      if (result.success && result.winners) {
        // เวลาหมุน 6.5 วินาที (6500ms) ให้จบทันกับเพลง
        const spinDuration = 6500;
        
        // ตั้งค่า client ID ของเครื่องที่กด spin
        setSpinClientId(clientIdRef.current);
        
        // Note: Sound will be played via WebSocket message from backend
        // ไม่ต้องเล่นเสียงที่นี่เพราะเสียงจะถูกเล่นผ่าน WebSocket message
        
        // Store metadata for saving later (แต่ยังไม่แสดงผลลัพธ์)
        const seed = result.seed || '';
        const ruleSnapshot = result.rule_snapshot || {};
        const resultData = result.result || {};
        setSelectedSeed(seed);
        setSelectedRuleSnapshot(ruleSnapshot);
        setSelectedResult(resultData);
        selectedSeedRef.current = seed;
        selectedRuleSnapshotRef.current = ruleSnapshot;
        selectedResultRef.current = resultData;
        setSelectedWinners(result.winners || []); // เก็บ winners ที่ได้จาก API
        
        // อย่าแสดงผลลัพธ์ทันที - สร้าง placeholder winners สำหรับแสดง card (แต่ยังไม่แสดงชื่อจริง)
        const placeholderWinners = result.winners.map(() => ({ name: undefined }));
        setCurrentWinners(placeholderWinners); // ใช้ placeholder เพื่อแสดง card
        setRevealedWinners([]); // ล้าง revealed winners
        
        // Staggered animation - แต่ละ card เริ่มหมุนทีละตัว (delay 100ms ต่อ card)
        const staggerDelay = 100; // ระยะห่างระหว่างแต่ละ card (ms)
        
        // เริ่ม spinning animation แบบ staggered
        Array.from({ length: result.winners.length }, (_, index) => {
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * staggerDelay);
        });
        
        // Stop spinning after calculated duration for each card (รวม delay)
        Array.from({ length: result.winners.length }, (_, index) => {
          const cardStartDelay = index * staggerDelay;
          setTimeout(() => {
            setSpinningCards(prev => {
              const newState = [...prev];
              newState[index] = false;
              return newState;
            });
          }, cardStartDelay + spinDuration);
        });

        // เปิดเผยผลลัพธ์หลังจาก animation เสร็จทั้งหมด
        const lastCardDelay = (result.winners.length - 1) * staggerDelay;
        setTimeout(() => {
          // หยุดเสียงเมื่อ animation เสร็จ
          if (spinSoundRef.current) {
            spinSoundRef.current.pause();
            spinSoundRef.current.currentTime = 0;
          }
          // แสดงผลลัพธ์หลังจาก animation เสร็จ
          setCurrentWinners(result.winners);
          setRevealedWinners(result.winners);
          // อย่า reset isSpinning ที่นี่ - ให้ disable ปุ่ม Spin จนกว่าจะบันทึก
          // setIsSpinning(false); จะ reset เมื่อบันทึกเสร็จใน handleSaveConfirm
        }, lastCardDelay + spinDuration + 500);
      } else {
        setError(result.error || 'Failed to select winners');
        setIsSpinning(false);
      }
    } catch (err: any) {
      console.error('Error selecting winners:', err);
      setError(err.response?.data?.error || 'Failed to select winners');
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    // ตรวจสอบว่ามีเครื่องอื่นกำลัง spin อยู่หรือไม่
    if (remoteIsSpinning && !isSpinning) {
      setError('มีเครื่องอื่นกำลัง spin อยู่ กรุณารอให้เสร็จก่อน');
      return;
    }
    
    // ใช้ revealedWinners หรือ selectedWinners (เก็บไว้ตอน spin) หรือ currentWinners ที่มี id property
    let winnersToSave: any[] = [];
    
    console.log('handleSaveClick - revealedWinners:', revealedWinners);
    console.log('handleSaveClick - selectedWinners:', selectedWinners);
    console.log('handleSaveClick - currentWinners:', currentWinners);
    
    if (revealedWinners.length > 0) {
      // ถ้ามี revealedWinners ใช้เลย (animation เสร็จแล้ว)
      winnersToSave = revealedWinners;
    } else if (selectedWinners.length > 0) {
      // ถ้ายังไม่มี revealedWinners แต่มี selectedWinners ใช้แทน (เก็บไว้ตอน spin)
      winnersToSave = selectedWinners;
    } else {
      // ตรวจสอบว่า currentWinners มี id property หรือไม่ (ไม่ใช่ placeholder)
      const validCurrentWinners = currentWinners.filter(w => w && w.id !== undefined);
      if (validCurrentWinners.length > 0) {
        winnersToSave = validCurrentWinners;
      } else {
        winnersToSave = currentWinners;
      }
    }
    
    console.log('handleSaveClick - winnersToSave:', winnersToSave);
    
    if (!winnersToSave || winnersToSave.length === 0) {
      setError('ไม่มีผู้ชนะที่จะบันทึก');
      return;
    }
    
    // ตรวจสอบว่า winners มี id property หรือไม่ (ใช้ id แทน name เพราะ API ใช้ id)
    const hasValidIds = winnersToSave.every(w => w && w.id);
    console.log('handleSaveClick - hasValidIds:', hasValidIds);
    if (!hasValidIds) {
      setError('ยังไม่สามารถบันทึกได้ กรุณารอให้การหมุนเสร็จสิ้นก่อน');
      return;
    }
    
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = useCallback(async () => {
    // ตรวจสอบว่ามีเครื่องอื่นกำลัง spin อยู่หรือไม่
    if (remoteIsSpinning && !isSpinning) {
      setError('มีเครื่องอื่นกำลัง spin อยู่ กรุณารอให้เสร็จก่อน');
      setIsSaveModalOpen(false);
      return;
    }
    
    // ใช้ revealedWinners หรือ selectedWinners (เก็บไว้ตอน spin) หรือ currentWinners ที่มี id property
    // ใช้ ref เพื่อให้ WebSocket handler ได้ข้อมูลล่าสุด
    let winnersToSave: any[] = [];
    
    if (revealedWinnersRef.current.length > 0) {
      // ถ้ามี revealedWinners ใช้เลย (animation เสร็จแล้ว)
      winnersToSave = revealedWinnersRef.current;
    } else if (selectedWinnersRef.current.length > 0) {
      // ถ้ายังไม่มี revealedWinners แต่มี selectedWinners ใช้แทน (เก็บไว้ตอน spin)
      winnersToSave = selectedWinnersRef.current;
    } else {
      // ตรวจสอบว่า currentWinners มี id property หรือไม่ (ไม่ใช่ placeholder)
      const validCurrentWinners = currentWinnersRef.current.filter(w => w && w.id !== undefined);
      if (validCurrentWinners.length > 0) {
        winnersToSave = validCurrentWinners;
      } else {
        winnersToSave = currentWinnersRef.current;
      }
    }
    
    const prize = selectedPrizeRef.current;
    if (!prize || !winnersToSave || winnersToSave.length === 0) {
      setError('ไม่มีผู้ชนะที่จะบันทึก');
      setIsSaveModalOpen(false);
      return;
    }
    
    // ตรวจสอบว่า winners มี id property หรือไม่ (ใช้ id แทน name เพราะ API ใช้ id)
    const hasValidIds = winnersToSave.every(w => w && w.id);
    if (!hasValidIds) {
      setError('ยังไม่สามารถบันทึกได้ กรุณารอให้การหมุนเสร็จสิ้นก่อน');
      setIsSaveModalOpen(false);
      return;
    }

    if (!canSpinRaffle()) {
      setError('คุณได้รางวัลแล้วในการบันทึกผลการจับสลาก');
      setIsSaveModalOpen(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Extract participant IDs from winners
      const participantIds = winnersToSave.map(w => w.id);
      
      // Call API to save winners (ใช้ ref เพื่อให้ได้ข้อมูลล่าสุด)
      await raffleApi.saveWinners(
        prize.id,
        participantIds,
        selectedSeedRef.current,
        selectedRuleSnapshotRef.current,
        selectedResultRef.current
      );
      
      // Refresh prize data to update dropdown
      await loadPrizes();
      
      // Refresh selectedPrize with fresh data from API (without full page refresh)
      if (prize) {
        try {
          const freshPrize = await raffleApi.getPrizePublic(prize.id);
          setSelectedPrize(freshPrize);
          
          // Check if prize is completed
          if (freshPrize.selected_count >= freshPrize.quantity) {
            // Remove from selection if completed
            setSelectedPrize(null);
          }
        } catch (err) {
          // If getPrizePublic fails, fallback to finding in prizes list
          const updatedPrize = prizesRef.current.find(p => p.id === prize.id);
          if (updatedPrize) {
            setSelectedPrize(updatedPrize);
            if (updatedPrize.selected_count >= updatedPrize.quantity) {
              setSelectedPrize(null);
            }
          }
        }
      }
      
      // Clear current winners and metadata
      setCurrentWinners([]);
      setRevealedWinners([]);
      setSelectedWinners([]);
      setSelectedSeed('');
      setSelectedRuleSnapshot(null);
      setSelectedResult(null);
      selectedSeedRef.current = '';
      selectedRuleSnapshotRef.current = null;
      selectedResultRef.current = null;
      setIsSaveModalOpen(false);
      
      // Reset spinClientId เพื่อให้สามารถ spin ใหม่ได้
      setSpinClientId(null);
      
      // เคลียค่าทั้งหมดหลังบันทึก
      setDisplayCount(1);
      setSpinningCards([]);
      setIsSpinning(false);
      
      // Trigger WinnersList refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error('Error saving winners:', err);
      setError(err.response?.data?.error || 'Failed to save winners');
    } finally {
      setLoading(false);
    }
  }, [canSpinRaffle, loadPrizes]);

  // Store handleSaveConfirm in ref for WebSocket handler
  useEffect(() => {
    handleSaveConfirmRef.current = handleSaveConfirm;
    console.log('handleSaveConfirmRef has been set');
  }, [handleSaveConfirm]);

  const handlePrizeChange = (prizeId: string) => {
    if (!prizeId) {
      setSelectedPrize(null);
      setCurrentWinners([]);
      return;
    }
    
    const prize = prizes.find(p => p.id === parseInt(prizeId, 10));
    if (prize) {
      setSelectedPrize(prize);
      setCurrentWinners([]);
    }
  };

  const handleDisplayCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0 && count <= 30) {
      setDisplayCount(count);
      // Clear current winners when changing display count
      setCurrentWinners([]);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-r/hsl from-emerald-700 to-sky-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    // <div className="min-h-screen bg-gradient-to-br from-zinc-900 from-10% via-zinc-900/90 via-50% to-zinc-900 to-90% text-white">
    <div className="min-h-screen bg-linear-to-r/hsl from-emerald-700 to-sky-900 text-white overflow-hidden">
      {/* WebSocket Connection Status Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 z-50">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      )}
      <div className="mx-auto grid grid-cols-4 h-screen max-h-screen">

        <div className='flex flex-col col-span-3 py-2 px-3 justify-between overflow-hidden' style={{ marginBottom: '40px' }}>
          <div className='flex flex-col flex-1 min-h-0'>
            {/* Grid Display Component */}
            <RaffleGridDisplay
              displayCount={displayCount}
              winners={currentWinners}
              revealedWinners={revealedWinners}
              spinningCards={spinningCards}
              error={error}
              loading={loading}
              eventId={eventId}
            />



          </div>
          <div className='bg-white grid grid-cols-3 gap-2 items-center text-zinc-800 p-1.5 rounded-xl shrink-0 relative z-50'>
            <div className='col-span-2 flex gap-2 items-center'>
              <div className="w-full grid grid-cols-3 gap-2">
                <select 
                  value={selectedPrize?.id.toString() || ''}
                  onChange={(e) => handlePrizeChange(e.target.value)}
                  className="w-full col-span-2 px-4 py-1  border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    loading || 
                    availablePrizes.length === 0 || 
                    isSpinning || 
                    remoteIsSpinning ||
                    (revealedWinners.length > 0 || (currentWinners.length > 0 && currentWinners.some(w => w && w.id)))
                  }
                >
                  <option value="">-- เลือกประเภทรางวัล --</option>
                  {availablePrizes.map((prize) => (
                    <option key={prize.id} value={prize.id.toString()}>
                      {prize.name} (เหลือ {prize.quantity - prize.selected_count} รางวัล)
                    </option>
                  ))}
                </select>
                <select
                  value={displayCount}
                  onChange={(e) => {
                    const numValue = parseInt(e.target.value, 10);
                    if (!isNaN(numValue)) {
                      handleDisplayCountChange(numValue.toString());
                    }
                  }}
                  className="w-full px-4 py-1 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !selectedPrize || 
                    isSpinning || 
                    remoteIsSpinning ||
                    (revealedWinners.length > 0 || (currentWinners.length > 0 && currentWinners.some(w => w && w.id)))
                  }
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2  h-full '>
              <button
                onClick={handleSpinClick}
                disabled={
                  isSpinning || 
                  remoteIsSpinning ||
                  !selectedPrize || 
                  loading || 
                  !canSpinRaffle() ||
                  (revealedWinners.length > 0 || (currentWinners.length > 0 && currentWinners.some(w => w && w.id)))
                }
                className='bg-amber-300 hover:bg-amber-400 border-amber-400 border-2 rounded-lg col-span-2 disabled:opacity-50 disabled:cursor-not-allowed'
                title={
                  !canSpinRaffle() 
                    ? 'คุณได้รางวัลแล้วในการจับสลาก' 
                    : isSpinning 
                    ? 'กำลังหมุน...' 
                    : (revealedWinners.length > 0 || (currentWinners.length > 0 && currentWinners.some(w => w && w.id)))
                    ? 'กรุณาบันทึกรางวัลก่อนทำการจับสลากครั้งใหม่'
                    : ''
                }
              >
                {isSpinning ? 'กำลังหมุน...' : 'Spin'}
              </button>
              <button 
                onClick={handleSaveClick}
                disabled={!currentWinners || currentWinners.length === 0 || loading || remoteIsSpinning}
                className='bg-blue-500 hover:bg-blue-400 border-blue-400 text-white border-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>

        {/* Right Component */}
        <WinnersList raffleEventId={raffleEventId} refreshTrigger={refreshTrigger} selectedPrize={selectedPrize} />
      </div>

      {/* Save Confirm Modal */}
      <SaveConfirmModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleSaveConfirm}
        winnerCount={currentWinners.length}
        prizeName={selectedPrize?.name}
        loading={loading}
      />

      {/* Spin Confirm Modal */}
      <SpinConfirmModal
        isOpen={isSpinModalOpen}
        onClose={() => {
          setIsSpinModalOpen(false);
          setIsSpinning(false); // Reset isSpinning เมื่อปิด modal โดยไม่ confirm
        }}
        onConfirm={handleSpin}
        prizeName={selectedPrize?.name}
        displayCount={displayCount}
        loading={loading || isSpinning}
      />
    </div>
  );
}

