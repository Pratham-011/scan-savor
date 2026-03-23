import { WhatsAppTemplate } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TemplatePreviewModalProps {
  template: WhatsAppTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryColorMap: Record<WhatsAppTemplate['category'], string> = {
  marketing: 'bg-blue-100 text-blue-800',
  utility: 'bg-green-100 text-green-800',
  authentication: 'bg-purple-100 text-purple-800',
  custom: 'bg-gray-100 text-gray-800',
};

const statusColorMap: Record<WhatsAppTemplate['status'], string> = {
  pending: 'bg-slate-100 text-slate-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paused: 'bg-orange-100 text-orange-800',
  disabled: 'bg-red-200 text-red-900',
  appeal_requested: 'bg-indigo-100 text-indigo-800',
  pending_deletion: 'bg-yellow-100 text-yellow-900',
  unknown: 'bg-gray-100 text-gray-800',
};

const statusLabelMap: Record<WhatsAppTemplate['status'], string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  paused: 'Paused',
  disabled: 'Disabled',
  appeal_requested: 'Appeal Requested',
  pending_deletion: 'Pending Deletion',
  unknown: 'Unknown',
};

export default function TemplatePreviewModal({ template, open, onOpenChange }: TemplatePreviewModalProps) {
  if (!template) return null;

  const headerComponent = (template.components || []).find(
    (component) => String(component?.type || '').toLowerCase() === 'header'
  );
  const footerComponent = (template.components || []).find(
    (component) => String(component?.type || '').toLowerCase() === 'footer'
  );
  const buttonsComponent = (template.components || []).find(
    (component) => String(component?.type || '').toLowerCase() === 'buttons'
  );
  const headerFormat = String((headerComponent?.format || '')).toLowerCase();
  const headerText = String(headerComponent?.text || '');
  const footerText = String(footerComponent?.text || '');
  const buttons = Array.isArray(buttonsComponent?.buttons) ? buttonsComponent.buttons : [];
  const headerHandle =
    Array.isArray(headerComponent?.example?.header_handle) && headerComponent.example.header_handle.length > 0
      ? String(headerComponent.example.header_handle[0])
      : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{template.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Category Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColorMap[template.status]}`}>
              {statusLabelMap[template.status]}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColorMap[template.category]}`}>
              {template.category === 'authentication' ? 'Authentication' : template.category}
            </span>
            {template.isDefault && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Default
              </span>
            )}
          </div>

          {/* Template Body Preview */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Message Preview</h3>
            <div className="mx-auto max-w-[340px] rounded-[30px] border border-gray-300 bg-slate-900 p-2 shadow-xl">
              <div className="rounded-[24px] bg-[linear-gradient(160deg,#0f1f1f,#12322f)] p-3">
                <div className="mb-3 flex items-center gap-2 text-[11px] text-emerald-100/80">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  WhatsApp Preview
                </div>

                <div className="ml-auto w-[88%] rounded-xl bg-[#dcf8c6] px-3 py-2 text-[#1f2937] shadow-sm">
                  {headerFormat === 'text' && headerText && (
                    <div className="mb-2 border-b border-[#b8e2a0] pb-1.5">
                      <p className="text-xs font-semibold whitespace-pre-wrap">{headerText}</p>
                    </div>
                  )}

                  {headerFormat && headerFormat !== 'text' && (
                    <div className="mb-2 rounded-md border border-[#b8e2a0] bg-[#eef8e6] px-2 py-1.5">
                      <p className="text-[11px] font-semibold capitalize">{headerFormat} attached</p>
                      {headerHandle && <p className="text-[10px] text-[#4b5563] truncate">{headerHandle}</p>}
                    </div>
                  )}

                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{template.body}</p>
                  {footerText && (
                    <p className="mt-2 text-[10px] text-[#6b7280] whitespace-pre-wrap">{footerText}</p>
                  )}
                  {buttons.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {buttons.map((button, index) => (
                        <div key={`${button.type || 'button'}-${index}`} className="rounded-md border border-[#b8e2a0] bg-[#eef8e6] px-2 py-1 text-[11px] font-medium text-[#166534]">
                          {String(button.text || button.type || 'Button')}
                          {button.type === 'url' && button.url ? ` -> ${String(button.url)}` : ''}
                          {button.type === 'phone_number' && button.phone_number ? ` -> ${String(button.phone_number)}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-[#6b7280] text-right">12:08</p>
                </div>
              </div>
            </div>
          </div>

          {/* Template Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 font-medium">Active</p>
              <p className="text-sm text-gray-900 font-semibold">{template.isActive ? 'Yes' : 'No'}</p>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 font-medium">Auto Send</p>
              <p className="text-sm text-gray-900 font-semibold">{template.autoSend ? 'Enabled' : 'Disabled'}</p>
            </div>
            {template.lastStatusCheck && (
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-600 font-medium">Last Status Check</p>
                <p className="text-xs text-gray-900">
                  {new Date(template.lastStatusCheck).toLocaleDateString()} {new Date(template.lastStatusCheck).toLocaleTimeString()}
                </p>
              </div>
            )}
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 font-medium">Created</p>
              <p className="text-xs text-gray-900">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Variables Help */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h4 className="text-xs font-semibold text-blue-900 mb-2">Available Variables</h4>
            <p className="text-xs text-blue-800">
              You can use: <code className="bg-blue-100 px-2 py-1 rounded">{'{{customer_name}}'}</code>, <code className="bg-blue-100 px-2 py-1 rounded">{'{{menu_link}}'}</code>, <code className="bg-blue-100 px-2 py-1 rounded">{'{{restaurant_name}}'}</code>
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
