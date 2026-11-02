package edu.algoventure;

import java.util.*;

/** Versioned replay of bubbleSort.ts / practiceBubbleMove, independent of rendering. */
final class BubbleTrace {
  record Item(int id, int value) {}
  record Snapshot(List<Item> items, int pair, int end, int pass) {}
  List<Item> items;
  int pair=0, end, pass=1, comparisons=0, swaps=0;
  boolean changed=false, done=false, passBoundary=false;

  BubbleTrace(List<Integer> input) {
    items=new ArrayList<>();
    for(int i=0;i<input.size();i++) items.add(new Item(i,input.get(i)));
    end=items.size()-1;
    skip();
  }
  Snapshot snapshot() { return new Snapshot(List.copyOf(items),pair,end,pass); }
  void step(boolean swap) {
    if(swap) { Collections.swap(items,pair,pair+1); swaps++; changed=true; }
    comparisons++;
    boolean last=pair+1==end;
    done=last&&(!changed||end==1);
    if(done) end=-1;
    else if(last) { end--; passBoundary=true; }
    else pair++;
  }
  void skip() {
    while(!done) {
      if(passBoundary) { pair=0; pass++; changed=false; passBoundary=false; }
      if(items.get(pair).value()>items.get(pair+1).value()) break;
      step(false);
    }
  }
  boolean move(int itemId,int target) {
    int from=-1;
    for(int i=0;i<items.size();i++) if(items.get(i).id()==itemId) from=i;
    if(done||from<0||target<0||target>=items.size()||from==target)
      throw ApiException.bad("Thao tác không phải một quyết định đổi chỗ hợp lệ để ghi log.");
    boolean correct=(from==pair&&target==pair+1)||(from==pair+1&&target==pair);
    if(correct) { step(true); skip(); }
    return correct;
  }
}
