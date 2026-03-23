import { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, Pencil, ArrowUp, ArrowDown, Bot, MessageSquareText, Sparkles, Info } from 'lucide-react';
import { whatsappApi, WhatsAppTemplate, QuickReplyRule, QuickReplyStep } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const newStep = (order: number): QuickReplyStep => ({
  order,
  kind: 'text',
  text: '',
});

export default function WhatsAppQuickReplies() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingQuickReplyId, setEditingQuickReplyId] = useState<string | null>(null);
  const [quickReplyForm, setQuickReplyForm] = useState({
    name: '',
    triggerText: '',
    matchType: 'contains' as 'contains' | 'equals',
    priority: 0,
    isActive: true,
    sequence: [newStep(0)] as QuickReplyStep[],
  });

  const activeTemplates = templates.filter((t) => t.isActive && t.status === 'approved');

  const loadData = async () => {
    setError(null);
    try {
      const [templateData, quickReplyData] = await Promise.all([
        whatsappApi.getTemplates(),
        whatsappApi.getQuickReplies(),
      ]);
      setTemplates(templateData.templates || []);
      setQuickReplies(quickReplyData.quickReplies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingQuickReplyId(null);
    setQuickReplyForm({
      name: '',
      triggerText: '',
      matchType: 'contains',
      priority: 0,
      isActive: true,
      sequence: [newStep(0)],
    });
  };

  const handleSave = async () => {
    setError(null);

    if (!quickReplyForm.name.trim()) {
      setError('Rule name is required');
      return;
    }

    if (!quickReplyForm.triggerText.trim()) {
      setError('Trigger text is required');
      return;
    }

    const sequence = quickReplyForm.sequence
      .map((step, index) => ({ ...step, order: index }))
      .filter((step) => {
        if (step.kind === 'template') {
          return !!step.templateId;
        }
        return !!step.text?.trim();
      });

    if (sequence.length === 0) {
      setError('Add at least one valid sequence step');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: quickReplyForm.name.trim(),
        triggerText: quickReplyForm.triggerText.trim(),
        matchType: quickReplyForm.matchType,
        priority: Number(quickReplyForm.priority) || 0,
        isActive: quickReplyForm.isActive,
        sequence,
      };

      if (editingQuickReplyId) {
        await whatsappApi.updateQuickReply(editingQuickReplyId, payload);
      } else {
        await whatsappApi.createQuickReply(payload);
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    setSaving(true);
    setError(null);
    try {
      await whatsappApi.deleteQuickReply(id);
      await loadData();
      if (editingQuickReplyId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setSaving(false);
    }
  };

  const updateStep = (index: number, patch: Partial<QuickReplyStep>) => {
    setQuickReplyForm((prev) => {
      const next = [...prev.sequence];
      next[index] = { ...next[index], ...patch };
      return { ...prev, sequence: next };
    });
  };

  const addTextStep = () => {
    setQuickReplyForm((prev) => ({
      ...prev,
      sequence: [
        ...prev.sequence,
        {
          order: prev.sequence.length,
          kind: 'text',
          text: 'Hi {{customer_name}}, here is our menu: {{menu_link}}',
        },
      ],
    }));
  };

  const addTemplateStep = () => {
    setQuickReplyForm((prev) => ({
      ...prev,
      sequence: [
        ...prev.sequence,
        {
          order: prev.sequence.length,
          kind: 'template',
          templateId: activeTemplates[0]?._id || null,
        },
      ],
    }));
  };

  const removeStep = (index: number) => {
    setQuickReplyForm((prev) => {
      const next = prev.sequence.filter((_, stepIndex) => stepIndex !== index);
      return {
        ...prev,
        sequence: next.length ? next : [newStep(0)],
      };
    });
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setQuickReplyForm((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.sequence.length) {
        return prev;
      }
      const next = [...prev.sequence];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return { ...prev, sequence: next };
    });
  };

  const handleEditRule = (rule: QuickReplyRule) => {
    setEditingQuickReplyId(rule._id);
    setQuickReplyForm({
      name: rule.name,
      triggerText: rule.triggerText,
      matchType: rule.matchType,
      priority: rule.priority,
      isActive: rule.isActive,
      sequence: (rule.sequence || []).length ? [...rule.sequence].sort((a, b) => a.order - b.order) : [newStep(0)],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guided Intro */}
      <div className="glass rounded-xl border border-border/50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/15 p-2">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Quick Reply Builder</h2>
            <p className="text-sm text-muted-foreground">
              Create automation in 3 simple steps: choose trigger text, add reply sequence, save the rule.
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">1. Trigger: what customer sends</div>
              <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">2. Replies: text or approved template</div>
              <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">3. Save and enable rule</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Rule Editor */}
      <div className="glass rounded-xl border border-border/50 p-4 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {editingQuickReplyId ? 'Edit Quick Reply Rule' : 'Create New Quick Reply Rule'}
        </h2>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 text-primary" />
          <span>
            Tip: Keep trigger short and specific. Example: "menu" with match type "contains" catches "please send menu" too.
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Step 1: Configure Trigger</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickReplyForm((prev) => ({ ...prev, name: 'Menu Request', triggerText: 'menu', matchType: 'contains' }))}
              className="gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Use menu example
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickReplyForm((prev) => ({ ...prev, name: 'Pricing Request', triggerText: 'price', matchType: 'contains' }))}
              className="gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Use price example
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Rule Name *</label>
            <input
              type="text"
              value={quickReplyForm.name}
              onChange={(e) => setQuickReplyForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Menu Request"
              className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Trigger Text *</label>
            <input
              type="text"
              value={quickReplyForm.triggerText}
              onChange={(e) => setQuickReplyForm((prev) => ({ ...prev, triggerText: e.target.value }))}
              placeholder="e.g., menu, show me menu"
              className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Match Type</label>
            <select
              value={quickReplyForm.matchType}
              onChange={(e) => setQuickReplyForm((prev) => ({ ...prev, matchType: e.target.value as 'contains' | 'equals' }))}
              className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="contains">Contains (partial match)</option>
              <option value="equals">Equals (exact match)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Priority</label>
            <input
              type="number"
              value={quickReplyForm.priority}
              onChange={(e) => setQuickReplyForm((prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))}
              placeholder="Higher number = checked first"
              className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Higher priority rules are checked first</p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
          <Switch
            checked={quickReplyForm.isActive}
            onCheckedChange={(checked) => setQuickReplyForm((prev) => ({ ...prev, isActive: checked }))}
          />
          <span className="text-sm text-foreground">Rule is active</span>
        </label>

        {/* Sequence Builder */}
        <div className="border-t border-border/40 pt-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Step 2: Add Reply Sequence</p>
          <p className="text-sm text-muted-foreground">Define messages in order. The bot sends Step 1 first, then Step 2, and so on.</p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={addTextStep} variant="outline" className="gap-2">
              <MessageSquareText className="w-4 h-4" />
              Add Text Reply
            </Button>
            <Button type="button" onClick={addTemplateStep} variant="outline" className="gap-2" disabled={!activeTemplates.length}>
              <Bot className="w-4 h-4" />
              Add Template Reply
            </Button>
          </div>

          {!activeTemplates.length && (
            <p className="text-xs text-amber-300">
              No active approved templates found. Activate and approve templates to use template replies.
            </p>
          )}

          <div className="space-y-3">
            {quickReplyForm.sequence.map((step, index) => (
              <div key={`${index}-${step.kind}`} className="border border-border/60 rounded-lg p-3 space-y-2 bg-background/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                    Step {index + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => moveStep(index, 1)}
                      disabled={index === quickReplyForm.sequence.length - 1}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => removeStep(index)}
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-300 hover:text-red-200 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>

                <select
                  value={step.kind}
                  onChange={(e) =>
                    updateStep(index, {
                      kind: e.target.value as 'template' | 'text',
                      templateId: e.target.value === 'template' ? step.templateId || null : null,
                      text: e.target.value === 'text' ? step.text || '' : '',
                    })
                  }
                  className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="text">Text Message</option>
                  <option value="template">Template Message</option>
                </select>

                {step.kind === 'template' ? (
                  <select
                    value={step.templateId || ''}
                    onChange={(e) => updateStep(index, { templateId: e.target.value || null })}
                    className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select template</option>
                    {activeTemplates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} ({template.status})
                      </option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    value={step.text || ''}
                    onChange={(e) => updateStep(index, { text: e.target.value })}
                    placeholder="Enter the message text"
                    rows={4}
                    className="w-full px-3 py-2 border border-border/60 bg-background/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-xs font-semibold text-foreground mb-2">Step 2 Preview</p>
            <p className="text-xs text-muted-foreground">
              When customer message {quickReplyForm.matchType === 'contains' ? 'contains' : 'equals'}{' '}
              <span className="text-foreground font-medium">"{quickReplyForm.triggerText || '...'}"</span>, bot will send{' '}
              <span className="text-foreground font-medium">{quickReplyForm.sequence.length}</span> step(s).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-4 border-t border-border/40">
          {editingQuickReplyId && (
            <Button onClick={resetForm} variant="outline">
              Cancel Edit
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !quickReplyForm.name.trim() || !quickReplyForm.triggerText.trim()}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingQuickReplyId ? 'Step 3: Update Rule' : 'Step 3: Create Rule'}
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <div className="glass rounded-xl border border-border/50 p-4">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Reply Rules</h2>

        {quickReplies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No quick reply rules yet. Create one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quickReplies.map((rule) => (
              <div
                key={rule._id}
                className="border border-border/60 bg-background/40 rounded-lg p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{rule.name}</h3>
                      {!rule.isActive && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/50">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Trigger: <code className="bg-background/70 border border-border/50 px-1.5 py-0.5 rounded text-xs text-foreground">"{rule.triggerText}"</code>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Type: {rule.matchType === 'contains' ? 'Partial match' : 'Exact match'}</span>
                      <span>Priority: {rule.priority}</span>
                      <span>Steps: {rule.sequence.length}</span>
                    </div>

                    {/* Sequence Summary */}
                    {rule.sequence.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {rule.sequence.map((step, idx) => {
                          const template = templates.find((t) => t._id === step.templateId);
                          return (
                            <div key={idx} className="text-xs text-muted-foreground ml-4">
                              <span className="text-muted-foreground/70">Step {idx + 1}:</span>{' '}
                              {step.kind === 'template' ? `Template: ${template?.name || 'Unknown'}` : `Text: ${step.text?.substring(0, 50)}...`}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={() => handleEditRule(rule)}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      onClick={() => handleDelete(rule._id)}
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-300 hover:text-red-200 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
