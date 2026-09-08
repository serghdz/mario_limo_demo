'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const occasions = [
  'Wedding celebration',
  'Night out',
  'Milestone celebration',
  'Other plans',
];
export default function QuoteForm() {
  const [occasion, setOccasion] = useState<string | null>(null),
    [draft, setDraft] = useState(''),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  const form = useRef<HTMLFormElement>(null),
    result = useRef<HTMLDivElement>(null);
  const [today, setToday] = useState('');
  useEffect(() => {
    const d = new Date();
    setToday(
      [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-'),
    );
  }, []);
  const prepare = () => {
    if (!form.current?.reportValidity()) return;
    const values = new FormData(form.current);
    const text = [
      'Trip request draft — Mario’s Signature Limousine',
      `Occasion: ${occasion || 'To be discussed'}`,
      `Date: ${values.get('date') || 'Flexible'}`,
      `Pickup: ${values.get('pickup')}`,
      `Destination / itinerary: ${values.get('destination')}`,
      `Guests: ${values.get('guests') || 'To be confirmed'}`,
      `Notes: ${values.get('notes') || 'None'}`,
      'Pricing, vehicle suitability and availability to be confirmed.',
      'This is a draft only. Nothing has been sent or booked.',
    ].join('\n');
    setDraft(text);
    setCopied(false);
    setCopyError(false);
    setTimeout(() => result.current?.focus(), 0);
    return text;
  };
  useEffect(() => {
    type ToolContext = {
      registerTool: (
        tool: unknown,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'prepare_trip_request_draft',
      description:
        'Prepare a local, visible quote request draft from the completed trip form. Does not send anything, confirm availability, or make a booking.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      execute: (input: unknown) => {
        if (
          !input ||
          typeof input !== 'object' ||
          Array.isArray(input) ||
          Object.keys(input).length
        )
          throw new Error(
            'Expected an empty object. Complete the visible form first.',
          );
        const text = prepare();
        if (!text) throw new Error('Complete the required trip fields.');
        return { status: 'draft_only', sent: false, draft: text };
      },
    };
    Promise.resolve(
      context.registerTool(tool, { signal: lifecycle.signal }),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, [occasion]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <div className="quote-form-wrap">
      <div className="booking-notice">
        <span className="notice-dot" />
        <p>
          Online booking is not connected yet. Prepare your trip details here;
          nothing is sent or reserved.
        </p>
      </div>
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          prepare();
        }}
        className="quote-form"
      >
        <div className="field">
          <Label htmlFor="occasion">The occasion</Label>
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger id="occasion">
              <SelectValue placeholder="What are you celebrating?" />
            </SelectTrigger>
            <SelectContent>
              {occasions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="field">
          <Label htmlFor="trip-date">
            Preferred date <span>(optional)</span>
          </Label>
          <Input id="trip-date" name="date" type="date" min={today} />
        </div>
        <div className="field">
          <Label htmlFor="pickup">Pickup area</Label>
          <Input
            id="pickup"
            name="pickup"
            placeholder="Neighborhood or venue"
            required
            maxLength={180}
          />
        </div>
        <div className="field">
          <Label htmlFor="destination">Destination or itinerary</Label>
          <Input
            id="destination"
            name="destination"
            placeholder="Where would you like to go?"
            required
            maxLength={220}
          />
        </div>
        <div className="field">
          <Label htmlFor="guests">
            Number of guests <span>(optional)</span>
          </Label>
          <Input
            id="guests"
            name="guests"
            type="number"
            min={1}
            max={99}
            step={1}
            placeholder="Vehicle fit to be confirmed"
          />
        </div>
        <div className="field full">
          <Label htmlFor="notes">
            Anything else in mind? <span>(optional)</span>
          </Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={1500}
            placeholder="Timing, stops, or details that matter to you…"
          />
        </div>
        <div className="form-bottom full">
          <Button className="prepare-button" type="submit">
            Prepare request <ArrowUpRight size={18} />
          </Button>
          <p>
            No payment. No reservation.
            <br />
            Your details stay on this page.
          </p>
        </div>
      </form>
      {draft && (
        <div
          ref={result}
          tabIndex={-1}
          className="quote-result"
          role="region"
          aria-label="Your unsent trip request"
        >
          <p className="eyebrow">YOUR DRAFT · NOT SENT</p>
          <pre>{draft}</pre>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
            {copied ? 'Copied' : 'Copy trip details'}
          </Button>
          <p role="status">
            {copyError
              ? 'Copy is unavailable. You can select and copy the draft above.'
              : copied
                ? 'Copied to your clipboard. Nothing has been sent.'
                : 'Contact details need to be added before this site can receive requests.'}
          </p>
        </div>
      )}
    </div>
  );
}
