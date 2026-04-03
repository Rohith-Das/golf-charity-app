  const markPaid = async (winnerId) => {
    const { error } = await supabase.from('winners')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', winnerId);
    if (error) toast.error('Update failed');
    else {
      toast.success('Marked as paid');
      setWinners(prev => prev.map(w =>
        w.id === winnerId ? { ...w, status: 'paid', paid_at: new Date().toISOString() } : w
      ));
    }
  };