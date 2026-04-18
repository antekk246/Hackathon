import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-2 border-cyan-400 text-white shadow-2xl shadow-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400">
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="language" className="text-blue-300 font-semibold">
              {t('settings.language')}
            </Label>
            <Select
              value={(i18n.language || 'en').split('-')[0]}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" className="bg-slate-800/80 border-2 border-blue-500/30 text-white hover:border-blue-400 transition-colors">
                <SelectValue placeholder={t('settings.language')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-2 border-blue-500/30 text-white">
                <SelectItem value="en" className="focus:bg-blue-600 focus:text-white">{t('settings.english')}</SelectItem>
                <SelectItem value="pl" className="focus:bg-blue-600 focus:text-white">{t('settings.polish')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
